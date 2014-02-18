FROM ubuntu:12.04

RUN apt-get update

RUN apt-get install -y build-essential
RUN apt-get install -y curl openssl libreadline6 libreadline6-dev curl zlib1g zlib1g-dev libssl-dev libyaml-dev libsqlite3-dev sqlite3 libxml2-dev libxslt-dev autoconf libc6-dev ncurses-dev automake libtool bison subversion pkg-config git

# Install node
RUN curl https://raw.github.com/creationix/nvm/master/install.sh | HOME=/root sh
RUN echo '[[ -s /root/.nvm/nvm.sh ]] && . /root/.nvm/nvm.sh' > /etc/profile.d/nvm.sh
RUN /bin/bash -l -c "nvm install 0.11"
RUN /bin/bash -l -c "nvm alias default 0.11"

ADD . /var/www

WORKDIR /var/www

RUN /bin/bash -l -c "npm install"

ENTRYPOINT ["./proxy.sh"]

