<?php get_header(); ?>

<main id="main" class="main-grid">
	<section class="section-filters">
		<input type="text" id="search" placeholder="Search">

		<?php
		$place_types = get_terms([
			'taxonomy'   => 'place_type',
			'hide_empty' => true,
		]);

		if (!empty($place_types) && !is_wp_error($place_types)) :
		?>
			<select id="place-type-filter" aria-label="Filter places by type">
				<option value="">Filter</option>
				<?php foreach ($place_types as $place_type) : ?>
					<option value="<?php echo esc_attr($place_type->slug); ?>">
						<?php
						$emoji = get_place_type_emoji($place_type->name);
						echo esc_html($emoji . ' ' . $place_type->name);
						?>
					</option>
				<?php endforeach; ?>
			</select>
		<?php endif; ?>

		<button class="btn-primary btn-clear" aria-label="Clear search input and filters">Clear</button>
	</section>

	<section class="section-menu">
		<?php
		wp_nav_menu(array(
			'theme_location'	=> 'primary',
			'container'				=> 'nav',
			'container_class'	=> 'primary-menu',
			'menu_class'			=> 'menu',
			'fallback_cb'			=> false
		));
		?>
	</section>

	<section class="section-places">
		<div class="places-header">
			<p class="places-count"></p>
			<div class="places-distance">
				<label class="switch">
					<input type="checkbox" class="checkbox-distance" aria-label="Sort places by distance">
					<span class="slider"></span>
				</label>
				<span class="label-text">Sort by distance</span>
			</div>
		</div>
		<div class="places-grid"></div>
	</section>

	<section class="section-map">
		<div id="map">
		</div>
	</section>
</main>

<?php get_footer(); ?>