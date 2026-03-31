pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        BACKEND_IMAGE  = "ashwinemcbalaji/devboard-backend"
        FRONTEND_IMAGE = "ashwinemcbalaji/devboard-frontend"
        DOCKERHUB_CREDENTIALS = "dockerhub-cred1"

        DATABASE_URL = "postgresql://postgres:password@host.docker.internal:5432/devboard"
        PORT = "5000"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'
                    withSonarQubeEnv('SonarQube') {
                        sh """
                        ${scannerHome}/bin/sonar-scanner \
                        -Dsonar.projectKey=devboard-app \
                        -Dsonar.sources=.
                        """
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    docker.build("${BACKEND_IMAGE}:latest", "backend")
                    docker.build("${FRONTEND_IMAGE}:latest", "frontend")
                }
            }
        }

        stage('Push to DockerHub') {
            steps {
                script {
                    docker.withRegistry('', DOCKERHUB_CREDENTIALS) {
                        docker.image("${BACKEND_IMAGE}:latest").push()
                        docker.image("${FRONTEND_IMAGE}:latest").push()
                    }
                }
            }
        }

        stage('Deploy Containers') {
            steps {
                sh '''
                docker stop devboard-backend || true
                docker rm devboard-backend || true
                docker stop devboard-frontend || true
                docker rm devboard-frontend || true

                docker run -d -p 5000:5000 \
                  -e PORT=5000 \
                  -e DATABASE_URL=${DATABASE_URL} \
                  --name devboard-backend \
                  ${BACKEND_IMAGE}:latest

                docker run -d -p 3000:80 \
                  --name devboard-frontend \
                  ${FRONTEND_IMAGE}:latest
                '''
            }
        }
    }
}
