#!/bin/sh
# Starts the Flask ML API (internal, port 5001) and then Spring Boot (public, $PORT).
cd /app/flask-api
gunicorn --workers 1 --bind 127.0.0.1:5001 mi_api:app &

# wait until Flask answers (max ~40s)
for i in $(seq 1 40); do
  curl -sf http://127.0.0.1:5001/health >/dev/null && break
  sleep 1
done

cd /app
exec java $JAVA_OPTS -jar app.jar
