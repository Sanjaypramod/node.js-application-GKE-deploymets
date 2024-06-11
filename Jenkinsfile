pipeline {
    agent any
    environment {
        IMAGE_NAME = 'gkeapplication'
        IMAGE_TAG = "${BUILD_NUMBER}"
        PROJECT_ID = 'certain-router-423311-c7'
        CLUSTER_NAME = 'jenkins'
        LOCATION = 'us-central1'
        CREDENTIALS_ID = 'b13ad57b-e9fb-4be9-ba02-db4ff71e3a50' // Replace with your actual Google Cloud credentials ID
        GCR_HOSTNAME = 'gcr.io'
        HELM_CHART_PATH = 'helm/chart'
        HELM_RELEASE_NAME = 'swiggy'
        HELM_NAMESPACE = 'swiggy'
        SNYK_ID = 'ac51f892-29b2-4244-a354-704ef0530e25' // Ensure this ID matches the one in Jenkins
    }
    stages {
        stage('Checkout from Git') {
            steps {
                git branch: 'master', url: 'https://github.com/Sanjaypramod/node.js-application-GKE-deploymets.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('OWASP FS SCAN') {
            steps {
                dependencyCheck additionalArguments: '--scan ./ --disableYarnAudit --disableNodeAudit', odcInstallation: 'DP-Check'
                dependencyCheckPublisher pattern: '**/dependency-check-report.xml'
            }
        }

        stage('Snyk Code Analysis') {
            steps {
                sh 'npm install -g snyk'
                sh 'snyk auth $SNYK_TOKEN'
                sh 'snyk code test --json --severity-threshold=high > snyk-results.json'
            }
        }

        stage('Snyk Test') {
            steps {
                script {
                    withCredentials([string(credentialsId: SNYK_ID, variable: 'SNYK_API_TOKEN')]) {
                        sh 'snyk test --token=$SNYK_API_TOKEN'
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    docker.build("${GCR_HOSTNAME}/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG}", "-f Application/Dockerfile Application")
                }
            }
        }

        stage('Docker Push') {
            steps {
                script {
                    withCredentials([file(credentialsId: CREDENTIALS_ID, variable: 'GCLOUD_SERVICE_KEY')]) {
                        sh 'gcloud auth activate-service-account --key-file=$GCLOUD_SERVICE_KEY'
                        sh 'gcloud auth configure-docker'
                        sh "docker push ${GCR_HOSTNAME}/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Docker Clean up') {
            steps {
                sh 'docker image prune -f'
            }
        }

        stage('Deploy to GKE') {
            steps {
                withCredentials([file(credentialsId: CREDENTIALS_ID, variable: 'GCLOUD_SERVICE_KEY')]) {
                    sh 'gcloud auth activate-service-account --key-file=$GCLOUD_SERVICE_KEY'
                    sh "gcloud container clusters get-credentials ${CLUSTER_NAME} --zone ${LOCATION} --project ${PROJECT_ID}"
                    sh "kubectl get ns ${HELM_NAMESPACE} || kubectl create ns ${HELM_NAMESPACE}"
                    sh """
                        helm upgrade --install ${HELM_RELEASE_NAME} ${HELM_CHART_PATH} \
                            --set image.repository=${GCR_HOSTNAME}/${PROJECT_ID}/${IMAGE_NAME} \
                            --set image.tag=${IMAGE_TAG} \
                            --namespace ${HELM_NAMESPACE} \
                            --wait
                    """
                }
            }
        }
    }
    post {
        always {
            script {
                // Archive the Snyk results
                archiveArtifacts artifacts: 'snyk-results.json', allowEmptyArchive: true
                // Optionally, publish the results to Snyk
                sh 'snyk monitor'
            }
            echo 'Pipeline execution completed!'
            // Add additional cleanup or notifications if necessary
        }
    }
}
