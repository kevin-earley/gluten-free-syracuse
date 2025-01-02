<?php

add_theme_support('post-thumbnails');
add_theme_support('title-tag');

function gluten_free_syracuse_enqueue_scripts() {
	wp_enqueue_style('gluten-free-syracuse-style', get_template_directory_uri() . '/assets/css/style.css');
	wp_enqueue_script('gluten-free-syracuse-script', get_template_directory_uri() . '/assets/js/script.js', [], null, true);
}

add_action('wp_enqueue_scripts', 'gluten_free_syracuse_enqueue_scripts');

function gluten_free_syracuse_register_menus() {
	register_nav_menus([
		'primary' => __('Primary Menu', 'gluten-free-syracuse'),
		'footer' => __('Footer Menu', 'gluten-free-syracuse')
	]);
}

add_action('after_setup_theme', 'gluten_free_syracuse_register_menus');

function gluten_free_syracuse_pre_get_posts($query) {
	if (! $query->is_main_query() || 'place' !== $query->get('post_type')) {
		return;
	}

	$query->set('orderby', 'title');
	$query->set('order', 'ASC');
}

add_action('pre_get_posts', 'gluten_free_syracuse_pre_get_posts');

add_filter('wpcf7_autop_or_not', '__return_false');

function get_place_type_emoji($place_type_name) {
	$place_type_icons = [
		'american'      => '🍔',
		'bakery'        => '🧁',
		'chinese'       => '🥡',
		'diner'         => '🍳',
		'fast food'     => '🍟',
		'groceries'     => '🛒',
		'health food'   => '🥗',
		'italian'       => '🍝',
		'indian'        => '🍛',
		'japanese'      => '🍣',
		'mediterranean' => '🥙',
		'mexican'       => '🌮',
		'pizza'         => '🍕',
		'sandwich'      => '🥪',
		'steakhouse'    => '🥩',
		'thai'          => '🍜',
		'vegan'         => '🌱',
	];

	return $place_type_icons[strtolower($place_type_name)] ?? '';
}

function fetch_places() {
	$search_input = sanitize_text_field($_POST['searchInput'] ?? '');
	$place_type_filter = sanitize_text_field($_POST['placeTypeFilter'] ?? '');
	$user_latitude = sanitize_text_field($_POST['userLatitude'] ?? '');
	$user_longitude = sanitize_text_field($_POST['userLongitude'] ?? '');

	$args = [
		'post_type'      => 'place',
		'posts_per_page' => -1,
		'orderby'        => 'title',
		'order'          => 'ASC',
		'post_status'    => 'publish',
	];

	if ($search_input) $args['s'] = $search_input;

	$tax_query = [];
	if ($place_type_filter) $tax_query[] = ['taxonomy' => 'place_type', 'field' => 'slug', 'terms' => $place_type_filter];

	if ($tax_query) $args['tax_query'] = ['relation' => 'AND', ...$tax_query];

	$query = new WP_Query($args);
	$places = [];

	if ($query->have_posts()) {
		while ($query->have_posts()) {
			$query->the_post();

			$place_types = get_the_terms(get_the_ID(), 'place_type');
			$place_type_name = $place_types && !is_wp_error($place_types) ? current(array_column($place_types, 'name')) : '';

			$street_address = get_field('street_address') ?? '';
			$city = get_field('city') ?? '';
			$state = get_field('state') ?? '';
			$zip = get_field('zip') ?? '';
			$phone = get_field('phone') ?? '';
			$website = get_field('website') ?? '';
			$latitude = get_field('latitude') ?? '';
			$longitude = get_field('longitude') ?? '';

			$distance = ($user_latitude && $user_longitude && $latitude && $longitude) ? calculate_distance($user_latitude, $user_longitude, $latitude, $longitude) : null;

			$places[] = [
				'name'          		=> get_the_title(),
				'placeTypeName'   	=> $place_type_name,
				'placeTypeEmoji'  	=> get_place_type_emoji($place_type_name),
				'streetAddress' 		=> $street_address,
				'city'          		=> $city,
				'state'         		=> $state,
				'zip'           		=> $zip,
				'phone'         		=> $phone,
				'website'       		=> $website,
				'latitude'      		=> $latitude,
				'longitude'     		=> $longitude,
				'distance'      		=> $distance,
			];
		}

		if ($user_latitude && $user_longitude) {
			usort($places, fn($a, $b) => ($a['distance'] ?? PHP_INT_MAX) <=> ($b['distance'] ?? PHP_INT_MAX));
		}
	}

	wp_reset_postdata();
	wp_send_json_success($places);
}

add_action('wp_ajax_fetch_places', 'fetch_places');
add_action('wp_ajax_nopriv_fetch_places', 'fetch_places');

function calculate_distance($lat1, $lon1, $lat2, $lon2) {
	$earth_radius = 3959;
	$lat1 = deg2rad($lat1);
	$lon1 = deg2rad($lon1);
	$lat2 = deg2rad($lat2);
	$lon2 = deg2rad($lon2);

	$dlat = $lat2 - $lat1;
	$dlon = $lon2 - $lon1;

	$a = sin($dlat / 2) ** 2 + cos($lat1) * cos($lat2) * sin($dlon / 2) ** 2;
	$c = 2 * atan2(sqrt($a), sqrt(1 - $a));

	return $earth_radius * $c;
}
