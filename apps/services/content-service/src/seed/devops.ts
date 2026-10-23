import { SeedSubject } from './types';

const G = 'DevOps, Docker & Cloud';

export const devops: SeedSubject[] = [
  {
    slug: 'docker', name: 'Docker', icon: 'Container', accent: '#0ea5e9', group: G,
    description: 'Images, multi-stage builds, volumes and container networking.',
    topics: [
      {
        slug: 'docker-fundamentals', title: 'Images, Containers & Dockerfiles', minutes: 6,
        summary: 'Package an app once and run it anywhere, with small and safe images.',
        doc: `
## Image versus container

An **image** is a read only template made of layers. A **container** is a running instance of an image with its own process, filesystem and network. Containers share the host kernel, which makes them lighter than virtual machines.

## A multi-stage Dockerfile

Build in one stage and copy only the output into a slim final image. This keeps compilers and source code out of production.

~~~dockerfile
# build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# runtime stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
USER node
CMD ["node", "dist/main.js"]
~~~

## Everyday commands

~~~bash
# build and run
docker build -t my-api:1.0 .
docker run -d --name api -p 4000:4000 my-api:1.0
docker ps
docker logs -f api
~~~

> Copy package files before source code so Docker can cache the dependency layer.
`,
        questions: [
          { d: 'beginner', q: `What is the difference between a container and a virtual machine?`,
            a: `A virtual machine runs a full guest operating system on a hypervisor. A container shares the host kernel and isolates only the process, filesystem and network, so it starts in seconds and uses far less memory.`,
            cmd: `docker ps
>> CONTAINER ID   IMAGE       STATUS         PORTS
>> 3f2a1c9d0b7e   my-api:1.0  Up 2 minutes   0.0.0.0:4000->4000/tcp`,
            t: `Containers share the kernel, VMs bring their own.` },
          { d: 'intermediate', q: `Why use a multi-stage build?`,
            a: `It separates build tools from the runtime. The final image contains only what the app needs to run, so it is smaller, faster to pull and has a smaller attack surface.`,
            code: `FROM node:20-alpine AS build
RUN npm ci && npm run build

FROM node:20-alpine
COPY --from=build /app/dist ./dist`, lang: 'dockerfile',
            cmd: `docker build -t my-api:1.0 .
docker images my-api`,
            t: `Build fat, ship thin.` },
          { d: 'senior', q: `How do you shrink and harden a production image?`,
            a: `Use a small base such as alpine or distroless, multi-stage builds and a dockerignore file. Order layers for caching, run as a non root user, pin versions, scan images for vulnerabilities in CI and avoid baking secrets into layers.`,
            cmd: `# scan an image for known CVEs
docker scout cves my-api:1.0
docker run --read-only --user 1000 my-api:1.0`,
            t: `Small base, non root, scanned, no secrets in layers.` },
        ],
      },
      {
        slug: 'compose-networking', title: 'Compose, Volumes & Networking', minutes: 6,
        summary: 'Run multi container stacks and keep their data and traffic organised.',
        doc: `
## Compose in one file

Docker Compose describes several services, their networks and volumes in YAML. Services on the same Compose network reach each other by **service name**, so the API connects to the host called mongo.

~~~yaml
services:
  api:
    build: .
    ports: ["4000:4000"]
    environment:
      MONGO_URI: mongodb://mongo:27017/app
    depends_on: [mongo]
  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
volumes:
  mongo_data:
~~~

## Volumes versus bind mounts

- **Volume**: managed by Docker, best for database data.
- **Bind mount**: maps a host folder, best for live code in development.

~~~bash
docker compose up -d
docker compose logs -f api
docker compose down
~~~
`,
        questions: [
          { d: 'beginner', q: `What is the difference between a volume and a bind mount?`,
            a: `A volume is created and managed by Docker and persists independently of containers. A bind mount maps a specific host path into the container. Use volumes for persistent data and bind mounts for development.`,
            cmd: `docker volume create mongo_data
docker run -v mongo_data:/data/db mongo:7`,
            t: `Volumes for data, bind mounts for dev code.` },
          { d: 'intermediate', q: `How do containers in a Compose stack find each other?`,
            a: `Compose creates a default network and gives each service a DNS name equal to its service name. The API can therefore use mongo as the hostname. Published ports are only needed for access from the host.`,
            code: `environment:
  MONGO_URI: mongodb://mongo:27017/app`, lang: 'yaml',
            t: `Use the service name as the hostname.` },
          { d: 'senior', q: `A container cannot reach another service. How do you debug it?`,
            a: `Check both are on the same network, confirm the target is listening on 0.0.0.0 and not only 127.0.0.1, and test DNS and connectivity from inside the failing container. Remember that depends_on waits for start, not for readiness, so add a healthcheck.`,
            cmd: `docker network inspect app_default
docker compose exec api sh
# inside the container
nslookup mongo
wget -qO- http://mongo:27017`,
            t: `Same network, right bind address, healthcheck for readiness.` },
        ],
      },
    ],
  },
  {
    slug: 'devops-cloud', name: 'DevOps & Cloud', icon: 'Cloud', accent: '#a78bfa', group: G,
    description: 'CI/CD pipelines, Nginx, Kubernetes and the AWS services you meet first.',
    topics: [
      {
        slug: 'cicd-nginx', title: 'CI/CD Pipelines & Nginx', minutes: 7,
        summary: 'Automate build, test and deploy, then front your app with a reverse proxy.',
        doc: `
## CI and CD

**Continuous Integration** builds and tests every change automatically. **Continuous Delivery** keeps the main branch always releasable, and **Continuous Deployment** ships each passing change to production without a manual step.

~~~yaml
name: ci
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm test
      - run: docker build -t my-api:\${{ github.sha }} .
~~~

## Nginx as a reverse proxy

~~~nginx
server {
  listen 80;
  server_name example.com;

  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
  }
}
~~~

~~~bash
# validate then reload without downtime
sudo nginx -t
sudo nginx -s reload
~~~
`,
        questions: [
          { d: 'beginner', q: `What is the difference between CI and CD?`,
            a: `CI merges and tests code frequently with automated builds so problems appear early. CD takes the tested build and delivers it to an environment, either with a manual approval (delivery) or automatically (deployment).`,
            t: `CI checks the code, CD ships it.` },
          { d: 'intermediate', q: `How do you configure Nginx as a reverse proxy?`,
            a: `Define a server block that listens on a port and a location that uses proxy_pass to forward requests to the app. Pass the Host and client IP headers so the app sees the original request. Test the config before reloading.`,
            code: `location / {
  proxy_pass http://127.0.0.1:4000;
  proxy_set_header Host $host;
}`, lang: 'nginx',
            cmd: `sudo nginx -t
>> syntax is ok
sudo nginx -s reload`,
            t: `proxy_pass plus forwarded headers, test before reload.` },
          { d: 'senior', q: `Compare rolling, blue-green and canary deployments.`,
            a: `Rolling replaces instances a few at a time, which is simple and cheap but runs two versions together. Blue-green keeps two full environments and switches traffic at once, giving instant rollback at double the cost. Canary sends a small share of traffic to the new version and grows it while watching metrics, which limits the blast radius.`,
            t: `Rolling is cheap, blue-green is instant rollback, canary is safest.` },
        ],
      },
      {
        slug: 'kubernetes-aws', title: 'Kubernetes & AWS Basics', minutes: 8,
        summary: 'Run containers at scale with Kubernetes and meet the core AWS services.',
        doc: `
## Kubernetes in short

A **Pod** is the smallest unit and holds one or more containers. A **Deployment** keeps the desired number of Pods running and handles rolling updates. A **Service** gives Pods a stable address.

~~~yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels: { app: api }
  template:
    metadata:
      labels: { app: api }
    spec:
      containers:
        - name: api
          image: my-api:1.0
          ports: [{ containerPort: 4000 }]
          readinessProbe:
            httpGet: { path: /health, port: 4000 }
~~~

~~~bash
kubectl apply -f deployment.yaml
kubectl get pods
kubectl rollout status deployment/api
kubectl logs deploy/api
~~~

## AWS first steps

- **EC2**: virtual servers.
- **S3**: object storage for files and backups.
- **IAM**: users, roles and permissions. Grant the least privilege needed.
- **RDS**: managed relational databases.
`,
        questions: [
          { d: 'beginner', q: `What is the difference between a Pod and a Deployment?`,
            a: `A Pod is one or more containers that run together and share a network. A Deployment manages a set of identical Pods, keeps the desired replica count and performs rolling updates and rollbacks.`,
            cmd: `kubectl get pods
>> NAME                   READY   STATUS    RESTARTS
>> api-6d9f7c5b8-4xk2p    1/1     Running   0`,
            t: `Deployments manage Pods for you.` },
          { d: 'intermediate', q: `Explain the Service types ClusterIP, NodePort and LoadBalancer.`,
            a: `ClusterIP exposes the Service only inside the cluster and is the default. NodePort opens a fixed port on every node. LoadBalancer asks the cloud provider for an external load balancer that routes to the Service. An Ingress adds host and path routing on top.`,
            t: `Internal, node port, cloud load balancer.` },
          { d: 'senior', q: `How do probes and autoscaling work together for reliable scaling?`,
            a: `A readiness probe keeps a Pod out of the Service until it can take traffic, and a liveness probe restarts a stuck container. The Horizontal Pod Autoscaler adds or removes replicas based on metrics such as CPU. Set resource requests so the autoscaler can compute utilisation, and use readiness so new Pods do not receive traffic early.`,
            code: `readinessProbe:
  httpGet: { path: /health, port: 4000 }
  initialDelaySeconds: 5
resources:
  requests: { cpu: 200m, memory: 256Mi }`, lang: 'yaml',
            cmd: `kubectl autoscale deployment api --min=3 --max=10 --cpu-percent=70
kubectl get hpa`,
            t: `Requests enable HPA, readiness protects users.` },
        ],
      },
    ],
  },
];
