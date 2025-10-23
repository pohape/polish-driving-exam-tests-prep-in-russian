# --- App image: Apache + PHP 8.2 ---
FROM php:8.2-apache

# System deps + PHP extensions
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    libzip-dev \
    libonig-dev \
    unzip \
    git \
    && docker-php-ext-install mbstring \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

# App code
WORKDIR /var/www
COPY server /var/www/server

# Apache -> Lumen public/
RUN sed -ri -e 's!/var/www/html!/var/www/server/public!g' /etc/apache2/sites-available/000-default.conf \
    && printf '\n<Directory /var/www/server/public>\n  AllowOverride All\n  Require all granted\n</Directory>\n' >> /etc/apache2/apache2.conf

# Ensure runtime dirs exist and are writable
RUN mkdir -p /var/www/server/storage/ramdisk_tmpfs \
    && chown -R www-data:www-data /var/www/server/storage

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN cd /var/www/server \
    && composer install --no-dev --prefer-dist --no-interaction

# Expose (internal; not published on host; Caddy will proxy)
EXPOSE 80
