pipeline {
    agent any
    environment {
        IMAGE_NAME = 'gkeapplication'
        IMAGE_TAG = "${BUILD_NUMBER}"
        PROJECT_ID = 'certain-router-423311-c7'
        CLUSTER_NAME = 'jenkins'
        LOCATION = 'us-central1'
        CREDENTIALS_ID = 'b13ad57b-e9fb-4be9-ba02-db4ff71e3a50' // Ensure this is the correct ID
        GCR_HOSTNAME = 'gcr.io'
        HELM_CHART_PATH = 'helm/chart' // Path to your Helm chart
        HELM_RELEASE_NAME = 'swiggy'
        HELM_NAMESPACE = 'swiggy'
    }
    stages {
        stage('Checkout from Git') {
            steps {
                git branch: 'master', url: 'https://github.com/Sanjaypramod/node.js-application-GKE-deploymets.git'
            }
        }
        stage('Docker Build') {
            steps {
                script {
                    def image = docker.build("${GCR_HOSTNAME}/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG}", "-f Application/Dockerfile Application")
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
                sh 'echo "Cleaning Docker Images"'
                sh 'docker rmi -f $(docker images -q) || echo "No images to remove"'
            }
        }
        stage('Helm Install') {
            steps {
                script {
                    sh """
                        helm version || {
                            curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
                            chmod 700 get_helm.sh
                            ./get_helm.sh
                        }
                    """
                }
            }
        }
        stage('GKE Authentication') {
            steps {
                withCredentials([file(credentialsId: CREDENTIALS_ID, variable: 'GCLOUD_SERVICE_KEY')]) {
                    sh 'gcloud auth activate-service-account --key-file=$GCLOUD_SERVICE_KEY'
                    sh "gcloud container clusters get-credentials ${CLUSTER_NAME} --zone ${LOCATION} --project ${PROJECT_ID}"
                }
            }
        }
        stage('Deploy Helm Chart') {
            steps {
                script {
                    sh 'kubectl create ns ${HELM_NAMESPACE} || true'
                    // Deploying the Helm chart with updated image tag
                    sh """
                        helm upgrade --install ${HELM_RELEASE_NAME} ./${HELM_CHART_PATH} \
                            --set image.repository=${GCR_HOSTNAME}/${PROJECT_ID}/${IMAGE_NAME} \
                            --set image.tag=${IMAGE_TAG} \
                            --namespace ${HELM_NAMESPACE} \
                            --wait
                    """
                }
            }
        }
    }
}

