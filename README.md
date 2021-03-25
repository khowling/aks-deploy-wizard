
## Add to generate AKS deployment template paramters

### to run locally

```
REACT_APP_AZ_TEMPLATE_ARG="--template-file ../aks-deploy-arm/main.bicep" 
REACT_APP_AZ_TEMPLATE_ARG="--template-uri https://raw.githubusercontent.com/khowling/aks-deploy-arm/master/main.json" 
REACT_APP_K8S_VERSION="1.19.7" 
REACT_APP_APPINSIGHTS_KEY="xxx"
npm start
```

### to build assets
```
npm run-script build
```