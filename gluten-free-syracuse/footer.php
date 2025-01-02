<footer id="footer">
	<div class="container">
		<p>&copy; <?php echo date("Y"); ?> <a href="/"><?php bloginfo('name'); ?></a></p>

		<?php
		wp_nav_menu(array(
			'theme_location'	=> 'footer',
			'container_class'	=> 'footer-menu',
			'menu_class'			=> 'menu',
			'fallback_cb'			=> false
		));
		?>
	</div>
</footer>

<?php wp_footer(); ?>
</body>

</html>