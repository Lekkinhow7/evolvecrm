# CRM na VPS (EasyPanel). Não compila nada aqui: baixa a versão que o GitHub
# montou (workflow "Versão para a VPS") e só liga o servidor. Assim a VPS não
# fica pesada na hora de publicar.
FROM node:22-slim
WORKDIR /app
ADD https://github.com/Lekkinhow7/evolvecrm/releases/download/vps-succaozero/crm.tgz /tmp/crm.tgz
RUN tar xzf /tmp/crm.tgz -C /app && rm /tmp/crm.tgz
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["node", "server.js"]
