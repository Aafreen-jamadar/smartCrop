# ---------- 1) build the Spring Boot jar ----------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY backend/pom.xml .
RUN mvn -q -B dependency:go-offline
COPY backend/src ./src
RUN mvn -q -B -DskipTests package

# ---------- 2) runtime: Python (Flask ML) + Java (Spring Boot) ----------
FROM python:3.11-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends openjdk-17-jre-headless curl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY flask-api/requirements.txt flask-api/requirements.txt
RUN pip install --no-cache-dir -r flask-api/requirements.txt

COPY flask-api flask-api
COPY --from=build /build/target/*.jar app.jar
COPY start.sh start.sh
RUN chmod +x start.sh

ENV JAVA_OPTS="-Xmx300m -XX:+UseSerialGC"
EXPOSE 8080
CMD ["./start.sh"]
