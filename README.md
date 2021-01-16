
## Add to generate AKS deployment template paramters

### to run locally

```
REACT_APP_AZ_TEMPLATE_ARG="--template-uri https://raw.githubusercontent.com/khowling/aks-deploy-arm/master/main.json" REACT_APP_K8S_VERSION="1.19.3" REACT_APP_APPINSIGHTS_KEY="xxx" npm start
REACT_APP_AZ_TEMPLATE_ARG="--template-file ./main.json" REACT_APP_K8S_VERSION="1.19.3" REACT_APP_APPINSIGHTS_KEY="xxx" npm start
```

### to build assets

REACT_APP_AZ_TEMPLATE_ARG="" CREACT_APP_APPINSIGHTS_KEY="xxx" npm start