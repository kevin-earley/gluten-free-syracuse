<?php get_header(); ?>

<main id="main">
	<div class="container">
		<div class="content">
			<h2><?php the_title(); ?></h2>
			<?php the_content(); ?>
			<a href="/" class="link-back" aria-label="Go back to the main directory and map overview">Back to directory and map</a>
		</div>
	</div>
</main>

<?php get_footer(); ?>