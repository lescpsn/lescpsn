FROM httpd:2.4

RUN apt-get update
RUN apt-get install -yq ruby ruby-dev build-essential git

RUN gem install --no-ri --no-rdoc bundler
ADD Gemfile /app/Gemfile
ADD Gemfile.lock /app/Gemfile.lock

WORKDIR /app
ADD . /app

RUN bundle install
RUN cd /app && bundle exec middleman build --clean

RUN cd /app && mv build/ public-html/
RUN cd /app && mv public-html/ /usr/local/apache2/htdocs/

EXPOSE 80
EXPOSE 443

VOLUME ["/url/local/apache2/htdocs"]