mkdir -p /var/ngspace
cd /var/ngspace

mkdir -p /root/.ssh/
ls /root/.ssh/

ssh-keyscan -H git.ngs.tech:8236 >> /root/.ssh/known_hosts
ssh -vT -i "/root/.ssh/authorized_keys" git@git.ngs.tech:8236

git clone ssh://git@git.ngs.tech:8236/mean/houston.git
git clone ssh://git@git.ngs.tech:8236/mean/dream.git
