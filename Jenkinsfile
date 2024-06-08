// pipeline {
//     agent any
//     environment {
//         IMAGE_NAME = 'gkeapplication'
//         IMAGE_TAG = "${BUILD_NUMBER}" // Dynamic tag based on Jenkins build number
//         PROJECT_ID = 'certain-router-423311-c7'
//         CLUSTER_NAME = 'jenkins'
//         LOCATION = 'us-central1'
//         CREDENTIALS_ID = 'b13ad57b-e9fb-4be9-ba02-db4ff71e3a50' // Replace with your credentials ID
//         GCR_HOSTNAME = 'gcr.io'
//         HELM_CHART_PATH = 'helm/chart' // Path to your Helm chart
//         HELM_RELEASE_NAME = 'swiggy'
//         HELM_NAMESPACE = 'swiggy'
//     }
//     stages {
//         stage('Checkout from Git') {
//             steps {
//                 // Checkout code from your Git repository
//                 git branch: 'master', url: 'https://github.com/Sanjaypramod/node.js-application-GKE-deploymets.git'
//             }
//         }
//         stage('Docker Build') {
//             steps {
//                 script {
//                     // Build Docker image with unique tag
//                     def image = docker.build("${GCR_HOSTNAME}/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG}", "-f Application/Dockerfile Application")
//                 }
//             }
//         }
//         stage('Docker Push') {
//             steps {
//                 script {
//                     // Push Docker image to GCR
//                     withCredentials([file(credentialsId: CREDENTIALS_ID, variable: 'GCLOUD_SERVICE_KEY')]) {
//                         sh 'gcloud auth activate-service-account --key-file=$GCLOUD_SERVICE_KEY'
//                         sh 'gcloud auth configure-docker'
//                         sh "docker push ${GCR_HOSTNAME}/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG}"
//                     }
//                 }
//             }
//         }
//         stage('Docker Clean up') {
//             steps {
//                 // Clean up local Docker images
//                 sh 'echo "Cleaning Docker Images"'
//                 sh 'docker rmi -f $(docker images -q) || echo "No images to remove"'
//             }
//         }
//         stage('Helm Install') {
//             steps {
//                 script {
//                     // Install Helm if not installed
//                     sh """
//                         helm version || {
//                             curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
//                             chmod 700 get_helm.sh
//                             ./get_helm.sh
//                         }
//                     """
//                 }
//             }
//         }
//         stage('GKE Authentication') {
//             steps {
//                 withCredentials([file(credentialsId: CREDENTIALS_ID, variable: 'GCLOUD_SERVICE_KEY')]) {
//                     // Authenticate and get credentials for GKE cluster
//                     sh 'gcloud auth activate-service-account --key-file=$GCLOUD_SERVICE_KEY'
//                     sh "gcloud container clusters get-credentials ${CLUSTER_NAME} --zone ${LOCATION} --project ${PROJECT_ID}"
//                 }
//             }
//         }
//         stage('Deploy Helm Chart') {
//             steps {
//                 script {
//                     // Create namespace if not exists
//                     sh 'kubectl create ns ${HELM_NAMESPACE} || true'
//                     // Deploy Helm chart with updated image tag
//                     sh """
//                         helm upgrade --install ${HELM_RELEASE_NAME} ./${HELM_CHART_PATH} \
//                             --set image.repository=${GCR_HOSTNAME}/${PROJECT_ID}/${IMAGE_NAME} \
//                             --set image.tag=${IMAGE_TAG} \
//                             --namespace ${HELM_NAMESPACE} \
//                             --wait
//                     """
//                 }
//             }
//         }
//     }
// }




pipeline {
    agent any
    environment {
        IMAGE_NAME = 'gkeapplication'
        IMAGE_TAG = "${BUILD_NUMBER}"
        PROJECT_ID = 'certain-router-423311-c7'
        CLUSTER_NAME = 'jenkins'
        LOCATION = 'us-central1'
        CREDENTIALS_ID = 'b13ad57b-e9fb-4be9-ba02-db4ff71e3a50'
        GCR_HOSTNAME = 'gcr.io'
        HELM_CHART_PATH = 'helm/chart'
        HELM_RELEASE_NAME = 'swiggy'
        HELM_NAMESPACE = 'swiggy'
        ZAP_HELM_CHART_PATH = 'helm/chart' // Path to your OWASP ZAP Helm chart
        ZAP_HELM_RELEASE_NAME = 'zap'
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
                    sh """
                        helm upgrade --install ${ZAP_HELM_RELEASE_NAME} ${ZAP_HELM_CHART_PATH} \
                            --namespace ${HELM_NAMESPACE} \
                            --wait
                    """
                }
            }
        }
        stage('Get ZAP URL') {
            steps {
                script {
                    // Get the external IP of the ZAP service
                    def zapIp = sh(script: "kubectl get svc ${ZAP_HELM_RELEASE_NAME} -n ${HELM_NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}'", returnStdout: true).trim()
                    env.ZAP_URL = "http://${zapIp}:8080"
                    echo "ZAP URL: ${env.ZAP_URL}"
                }
            }
        }
        stage('Get Application URL') {
            steps {
                script {
                    // Get the external IP of your application service
                    def appIp = sh(script: "kubectl get svc ${HELM_RELEASE_NAME} -n ${HELM_NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}'", returnStdout: true).trim()
                    env.TARGET_URL = "http://${appIp}"
                    echo "Target URL: ${env.TARGET_URL}"
                }
            }
        }
        stage('Run OWASP ZAP Scan') {
            steps {
                script {
                    // Spider the application
                    sh "curl -s ${ZAP_URL}/JSON/spider/action/scan/?url=${TARGET_URL}&recurse=true"
                    
                    // Active scan the application
                    sh "curl -s ${ZAP_URL}/JSON/ascan/action/scan/?url=${TARGET_URL}&recurse=true"
                    
                    // Generate report
                    sh "curl -s ${ZAP_URL}/OTHER/core/other/htmlreport/?output=zap_report.html"
                }
            }
        }
        stage('Publish ZAP Report') {
            steps {
                publishHTML(target: [
                    reportName : 'OWASP ZAP Report',
                    reportDir  : '.',
                    reportFiles: 'zap_report.html'
                ])
            }
        }
    }
    post {
        always {
            echo 'Cleanup steps...'
        }
    }
}
