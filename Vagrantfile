# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "precise64"
  config.vm.box_url = "http://files.vagrantup.com/precise64.box"

  config.vm.network "forwarded_port", guest: 4040, host: 4040

  config.vm.provision "docker",
    images: ["ubuntu"]

  config.vm.provision "shell",
    inline: "cd /vagrant && docker build -t node-api-proxy ."
end


