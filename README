# Clone the repository
first make sure that you have a copy of the repository on your local machine
```bash
git clone https://github.com/opswerks-academy/i7-databases.git
```

# Connect to the Cluster
Run the command to connect to the cluster make sure that you have have all of the pre-requisites installed
```bash
export KUBECONFIG=~/path/to/your/Kubeconfig.yaml
```
# get the necessary ports and IP
to get the necessary ports and IP so that you can access the applications
```bash
k get service -A // to find the applications accessible through an external IP
k get all -n namespace // to get all the pods, services, deployments and statefulsets from a namespace

important namespaces
splunk-operator // namespace of splunk
prometheus-operator // namespace of prometheus
grafana-operator // namespace of grafana
jenkins // namespace of jenkins
dev // namespace of the developement environment
prod // namespace of the production environment
```
# Access Jenkins
get the external IP of the node and in your browser type it in and use the port 31580
```bash
http://xxx.xx.xx.xx:31580/
```

# Jenkins Build
enter the credentials and trigger a build of the website and the database to the cluster
```
input image here
```

# check the pods
once the build is triggered go back to the cluster and check and wait if all of the pods have been created
```bash
k get pods -n dev // this is for the dev
k get pods -n prod // this is for the prod
```

# check the database
Check if the the database pod is bounded to a PV in the cluster
```bash
k get pvc -n dev
k get pvc -n prod
```

# access the website
now to access the website find the external IP of the pods by running the command
```bash
k get svc -n dev
k get svc -n prod
```

# Monitoring and data visualization
now to monitor the website get the external ip of the nodes and just add the port for splunk and attached below is the external IP of prometheus and grafana
```bash
k get nodes

Splunk:
http://xxx.xx.xx.x:32756

prometheus:
http://172.104.37.95/targets?search=

Grafana:
http://172.104.38.232/?orgId=1
```
