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
                        withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                            bat """
                            ${scannerHome}\\bin\\sonar-scanner.bat ^
                            -Dsonar.projectKey=devboard-app ^
                            -Dsonar.sources=. ^
                            -Dsonar.login=%SONAR_TOKEN%
                            """
                        }
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
                bat """
                docker stop devboard-backend || exit 0
                docker rm devboard-backend || exit 0
                docker stop devboard-frontend || exit 0
                docker rm devboard-frontend || exit 0

                docker run -d -p 5000:5000 ^
                  -e PORT=%PORT% ^
                  -e DATABASE_URL=%DATABASE_URL% ^
                  --name devboard-backend ^
                  ${BACKEND_IMAGE}:latest

                docker run -d -p 3000:80 ^
                  --name devboard-frontend ^
                  ${FRONTEND_IMAGE}:latest
                """
            }
        }
    }
}
