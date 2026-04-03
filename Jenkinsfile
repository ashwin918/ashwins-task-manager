pipeline {
    agent any
 
    triggers {
        githubPush()
    }
 
    environment {
        BACKEND_IMAGE    = "ashwinbalaji22778/devboard-backend"
        FRONTEND_IMAGE   = "ashwinbalaji22778/devboard-frontend"
        BACKEND_CONTAINER  = "devboard-backend"
        FRONTEND_CONTAINER = "devboard-frontend"
        DOCKERHUB_CREDS  = "dockerhub-cred1"
        SONAR_TOKEN_ID   = "sonar"
        IMAGE_TAG        = "${BUILD_NUMBER}"
        JWT_SECRET       = credentials('task-manager-jwt-secret')
        DB_PASSWORD      = credentials('task-manager-db-password')
    }
 
    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }
 
    stages {
 
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }
 
        stage('SonarQube Analysis') {
            steps {
                echo 'Running SonarQube analysis...'
                script {
                    def scannerHome = tool 'SonarScanner'
                    withSonarQubeEnv('SonarQube') {
                        withCredentials([string(credentialsId: "${SONAR_TOKEN_ID}", variable: 'SONAR_TOKEN')]) {
                            def result = bat returnStatus: true, script: "\"${scannerHome}\\bin\\sonar-scanner.bat\" -Dsonar.projectKey=ashwins-task-manager -Dsonar.projectName=\"Ashwins Task Manager\" -Dsonar.sources=ashwins-task-manager -Dsonar.exclusions=**/node_modules/**,**/build/**,**/*.test.* -Dsonar.token=%SONAR_TOKEN%"
                            if (result != 0) {
                                echo "WARNING: SonarQube unavailable (exit: ${result}). Continuing..."
                            } else {
                                echo 'SonarQube analysis completed successfully.'
                            }
                        }
                    }
                }
            }
        }
 
        stage('Build Docker Images') {
            parallel {
 
                stage('Build Backend') {
                    steps {
                        echo 'Building backend image...'
                        script {
                            docker.build("${env.BACKEND_IMAGE}:${env.IMAGE_TAG}", "ashwins-task-manager/backend")
                            docker.build("${env.BACKEND_IMAGE}:latest", "ashwins-task-manager/backend")
                        }
                    }
                }
 
                stage('Build Frontend') {
                    steps {
                        echo 'Building frontend image...'
                        script {
                            docker.build("${env.FRONTEND_IMAGE}:${env.IMAGE_TAG}", "ashwins-task-manager/frontend")
                            docker.build("${env.FRONTEND_IMAGE}:latest", "ashwins-task-manager/frontend")
                        }
                    }
                }
 
            }
        }
 
        stage('Push to DockerHub') {
            steps {
                echo 'Pushing images to DockerHub...'
                script {
                    docker.withRegistry('https://index.docker.io/v1/', "${DOCKERHUB_CREDS}") {
                        def backendImg = docker.image("${env.BACKEND_IMAGE}:${env.IMAGE_TAG}")
                        backendImg.push()
                        backendImg.push('latest')
                        def frontendImg = docker.image("${env.FRONTEND_IMAGE}:${env.IMAGE_TAG}")
                        frontendImg.push()
                        frontendImg.push('latest')
                    }
                }
            }
        }
 
        stage('Deploy Locally') {
            steps {
                echo 'Stopping and removing old containers...'
                bat "docker stop %BACKEND_CONTAINER%  2>nul & docker rm %BACKEND_CONTAINER%  2>nul & exit /b 0"
                bat "docker stop %FRONTEND_CONTAINER% 2>nul & docker rm %FRONTEND_CONTAINER% 2>nul & exit /b 0"
 
                echo 'Starting backend container...'
                bat "docker run -d -p 5000:5000 -e PORT=5000 -e JWT_SECRET=%JWT_SECRET% -e DB_PASSWORD=%DB_PASSWORD% --name %BACKEND_CONTAINER% --restart unless-stopped %BACKEND_IMAGE%:%IMAGE_TAG%"
 
                echo 'Starting frontend container...'
                bat "docker run -d -p 3000:80 --name %FRONTEND_CONTAINER% --restart unless-stopped %FRONTEND_IMAGE%:%IMAGE_TAG%"
 
                echo 'Deployment complete!'
                echo 'App -> http://localhost:3000'
                echo 'API -> http://localhost:5000'
            }
        }
 
    }
 
    post {
        success {
            node('') {
                echo "PIPELINE SUCCEEDED - devboard build #${BUILD_NUMBER}"
                bat "docker rmi ${env.BACKEND_IMAGE}:${env.IMAGE_TAG}  2>nul & exit /b 0"
                bat "docker rmi ${env.FRONTEND_IMAGE}:${env.IMAGE_TAG} 2>nul & exit /b 0"
                bat "docker image prune -f 2>nul & exit /b 0"
            }
        }
        failure {
            node('') {
                echo "PIPELINE FAILED - devboard build #${BUILD_NUMBER}"
                bat "docker rmi ${env.BACKEND_IMAGE}:${env.IMAGE_TAG}  2>nul & exit /b 0"
                bat "docker rmi ${env.FRONTEND_IMAGE}:${env.IMAGE_TAG} 2>nul & exit /b 0"
                bat "docker image prune -f 2>nul & exit /b 0"
            }
        }
    }
 
}
