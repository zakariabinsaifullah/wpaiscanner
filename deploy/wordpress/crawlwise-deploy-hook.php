<?php
/**
 * Plugin Name:  Crawlwise site deploy hook
 * Description:  Rebuilds and redeploys wpaiscanner.com whenever a post is published, updated, or unpublished.
 * Version:      1.0.0
 * Author:       Crawlwise
 * License:      GPL-2.0-or-later
 *
 * Install as a must-use plugin on blog.wpaiscanner.com:
 *   wp-content/mu-plugins/crawlwise-deploy-hook.php
 *
 * The hook URL is a credential — anyone holding it can trigger builds — so it
 * lives in wp-config.php, never in this file:
 *
 *   define( 'CRAWLWISE_DEPLOY_HOOK_URL', 'https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/<ID>' );
 *
 * Without that constant the plugin stays completely inert.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Post types whose changes appear on the marketing site. */
const CRAWLWISE_DEPLOY_POST_TYPES = array( 'post' );

/** Option holding the last attempt, surfaced on the Tools screen. */
const CRAWLWISE_DEPLOY_LOG_OPTION = 'crawlwise_deploy_last';

/**
 * Queue a deploy when a post enters or leaves the published state.
 *
 * Covers publishing, editing an already-published post, scheduled posts going
 * live (wp_publish_post transitions the same way), and unpublishing or
 * trashing — each of those changes what the static build should contain.
 */
add_action(
	'transition_post_status',
	static function ( $new_status, $old_status, $post ) {
		if ( ! in_array( $post->post_type, CRAWLWISE_DEPLOY_POST_TYPES, true ) ) {
			return;
		}

		// Revisions and autosaves never reach the REST API's published list.
		if ( wp_is_post_revision( $post ) || wp_is_post_autosave( $post ) ) {
			return;
		}

		if ( 'publish' !== $new_status && 'publish' !== $old_status ) {
			return;
		}

		crawlwise_queue_deploy( sprintf( '%s: %s → %s', $post->post_name, $old_status, $new_status ) );
	},
	10,
	3
);

/**
 * Permanently deleting a published post skips the status transition above, so
 * catch that separately. Emptying the trash does not — those posts left
 * 'publish' when they were trashed, and that build has already run.
 */
add_action(
	'before_delete_post',
	static function ( $post_id, $post ) {
		if ( ! in_array( $post->post_type, CRAWLWISE_DEPLOY_POST_TYPES, true ) ) {
			return;
		}

		if ( 'publish' === $post->post_status ) {
			crawlwise_queue_deploy( sprintf( '%s: deleted', $post->post_name ) );
		}
	},
	10,
	2
);

/**
 * Mark a deploy as needed. Several edits can land in one request (bulk edits,
 * quick edit); they collapse into a single build fired once on shutdown.
 */
function crawlwise_queue_deploy( $reason ) {
	static $queued = false;

	if ( $queued ) {
		return;
	}

	$queued = true;
	add_action(
		'shutdown',
		static function () use ( $reason ) {
			crawlwise_fire_deploy( $reason );
		}
	);
}

/**
 * POST the Deploy Hook. Cloudflare needs no auth header — the id in the URL is
 * the credential — and it de-duplicates requests that arrive while a build is
 * still queued, so a burst of edits does not become a queue of builds.
 */
function crawlwise_fire_deploy( $reason ) {
	if ( ! defined( 'CRAWLWISE_DEPLOY_HOOK_URL' ) || ! CRAWLWISE_DEPLOY_HOOK_URL ) {
		return;
	}

	// Close the browser's connection first: the editor should never wait on
	// Cloudflare. The request itself stays blocking so failures are logged.
	if ( function_exists( 'fastcgi_finish_request' ) ) {
		fastcgi_finish_request();
	}

	$response = wp_remote_post(
		CRAWLWISE_DEPLOY_HOOK_URL,
		array(
			'timeout'    => 15,
			'blocking'   => true,
			'user-agent' => 'Crawlwise deploy hook; ' . home_url(),
		)
	);

	if ( is_wp_error( $response ) ) {
		crawlwise_log_deploy( $reason, 'error', $response->get_error_message() );
		return;
	}

	$code = wp_remote_retrieve_response_code( $response );
	$body = json_decode( wp_remote_retrieve_body( $response ), true );

	if ( $code < 200 || $code >= 300 || empty( $body['success'] ) ) {
		$detail = isset( $body['errors'][0]['message'] )
			? $body['errors'][0]['message']
			: wp_remote_retrieve_response_message( $response );

		crawlwise_log_deploy( $reason, 'error', sprintf( 'HTTP %d — %s', $code, $detail ) );
		return;
	}

	// already_exists means Cloudflare folded this into a build still waiting to
	// start — the content will ship, so it is a success, not a skip.
	$detail = isset( $body['result']['build_uuid'] ) ? $body['result']['build_uuid'] : 'queued';

	if ( ! empty( $body['result']['already_exists'] ) ) {
		$detail .= ' (deduplicated)';
	}

	crawlwise_log_deploy( $reason, 'ok', $detail );
}

function crawlwise_log_deploy( $reason, $status, $detail ) {
	update_option(
		CRAWLWISE_DEPLOY_LOG_OPTION,
		array(
			'time'   => time(),
			'status' => $status,
			'reason' => $reason,
			'detail' => $detail,
		),
		false
	);

	if ( 'ok' !== $status ) {
		error_log( sprintf( '[crawlwise-deploy] %s — %s (%s)', $status, $detail, $reason ) );
	}
}

/** A one-screen read-out of the last deploy, plus a manual trigger. */
add_action(
	'admin_menu',
	static function () {
		add_management_page(
			'Site deploy',
			'Site deploy',
			'manage_options',
			'crawlwise-deploy',
			'crawlwise_render_deploy_page'
		);
	}
);

function crawlwise_render_deploy_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$configured = defined( 'CRAWLWISE_DEPLOY_HOOK_URL' ) && CRAWLWISE_DEPLOY_HOOK_URL;

	if ( isset( $_POST['crawlwise_deploy_now'] ) && check_admin_referer( 'crawlwise_deploy_now' ) ) {
		crawlwise_fire_deploy( 'manual trigger' );
	}

	$last = get_option( CRAWLWISE_DEPLOY_LOG_OPTION );

	echo '<div class="wrap"><h1>Site deploy</h1>';

	if ( ! $configured ) {
		echo '<div class="notice notice-error"><p><code>CRAWLWISE_DEPLOY_HOOK_URL</code> is not defined in <code>wp-config.php</code>. Publishing will not rebuild wpaiscanner.com.</p></div>';
	} else {
		echo '<p>Publishing, editing, or unpublishing a post rebuilds <strong>wpaiscanner.com</strong> automatically. A build takes a minute or two.</p>';
	}

	if ( is_array( $last ) ) {
		printf(
			'<p><strong>Last attempt:</strong> %s — %s<br><em>%s</em><br>%s</p>',
			esc_html( human_time_diff( $last['time'] ) . ' ago' ),
			'ok' === $last['status'] ? '<span style="color:#12855a">success</span>' : '<span style="color:#c33a26">failed</span>',
			esc_html( $last['reason'] ),
			esc_html( $last['detail'] )
		);
	} else {
		echo '<p>No deploy has been triggered yet.</p>';
	}

	if ( $configured ) {
		echo '<form method="post">';
		wp_nonce_field( 'crawlwise_deploy_now' );
		submit_button( 'Rebuild the site now', 'secondary', 'crawlwise_deploy_now' );
		echo '</form>';
	}

	echo '</div>';
}
