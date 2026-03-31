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
                        withCredentials([string(credentialsId: 'sonar', variable: 'SONAR_TOKEN')]) {
                            bat """
                            ${scannerHome}\\bin\\sonar-scanner.bat ^
                            -Dsonar.projectKey=devboard-app ^
                            -Dsonar.sources=. ^
                            -Dsonar.token=%SONAR_TOKEN%
                            """
                        }
                    }
                }
            }
        }

        stage('Check Files') {
            steps {
                bat 'dir'
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    // Build and store images
                    backendImage = docker.build("${BACKEND_IMAGE}:latest", "ashwins-task-manager/backend")
                    frontendImage = docker.build("${FRONTEND_IMAGE}:latest", "ashwins-task-manager/frontend")
                }
            }
        }

        stage('Push to DockerHub') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', DOCKERHUB_CREDENTIALS) {
                        backendImage.push()
                        frontendImage.push()
                    }
                }
            }
        }

        stage('Deploy Containers') {
            steps {
                bat """
                docker stop devboard-backend || echo "not running"
                docker rm devboard-backend || echo "not exists"

                docker stop devboard-frontend || echo "not running"
                docker rm devboard-frontend || echo "not exists"

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
