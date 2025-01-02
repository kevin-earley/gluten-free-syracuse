<?php
function register_custom_post_types() {
	// Places
	$place_labels = array(
		'name'               => 'Places',
		'singular_name'      => 'Place',
		'add_new_item'       => 'Add New Place',
		'edit_item'          => 'Edit Place',
		'new_item'           => 'New Place',
		'view_item'          => 'View Place',
		'view_items'         => 'View Places',
		'search_items'       => 'Search Places',
		'not_found'          => 'No Places found.',
		'not_found_in_trash' => 'No Places in Trash.',
		'all_items'          => 'All Places',
	);

	$place_args = array(
		'labels'             => $place_labels,
		'public'             => true,
		'show_in_rest'       => true,
		'menu_position'      => 20,
		'menu_icon'          => 'dashicons-food',
		'supports'           => array('title', 'thumbnail'),
		'rewrite'            => false
	);

	register_post_type('place', $place_args);

	// Places - Place Types
	$place_type_labels = array(
		'name'              => 'Place Types',
		'singular_name'     => 'Place Type',
		'search_items'      => 'Search Place Types',
		'all_items'         => 'All Place Types',
		'edit_item'         => 'Edit Place Type',
		'view_item'         => 'View Place Type',
		'update_item'       => 'Update Place Type',
		'add_new_item'      => 'Add New Place Type',
		'new_item_name'     => 'New Place Type Name',
	);

	$place_type_args = array(
		'labels'            => $place_type_labels,
		'show_ui'           => true,
		'show_in_rest'      => true,
		'show_admin_column' => true,
		'hierarchical'      => true,
	);

	register_taxonomy('place_type', array('place'), $place_type_args);
}

add_action('init', 'register_custom_post_types');
