import React from 'react';
import { Image, TextField, Link, Separator, DropdownMenuItemType, Dropdown, Stack, Text, Toggle, Label, MessageBar, MessageBarType } from '@fluentui/react';

import { adv_stackstyle } from './common'

export default function ({ updateFn, net, addons, cluster, deploy, invalidArray, allok }) {
  /*
    let deploy_version = "v1.6"
    var queryString = window && window.location.search
    if (queryString) {
      var match = queryString.match('[?&]v=([^&]+)')
      if (match) {
        deploy_version = match[1]
      }
    }
  */
  const apiips_array = deploy.apiips.split(',').filter(x => x.trim())
  const armcmd = `az group create -l ${deploy.location} -n ${deploy.clusterName}-rg \n` +
    `az deployment group create -g ${deploy.clusterName}-rg  ${process.env.REACT_APP_AZ_TEMPLATE_ARG} --parameters` +
    ` \\\n   resourceName=${deploy.clusterName}` +
    ` \\\n   kubernetesVersion=${process.env.REACT_APP_K8S_VERSION}` +
    ` \\\n   agentCount=${cluster.count}` +
    (cluster.vmSize !== 'default' ? ` \\\n   agentVMSize=${cluster.vmSize}` : '') +
    (cluster.autoscale ? ` \\\n   agentCountMax=${cluster.maxCount}` : '') +
    (cluster.osDiskType === 'Managed' ? ` \\\n   osDiskType=${cluster.osDiskType} ${(cluster.osDiskSizeGB > 0 ? `osDiskSizeGB=${cluster.osDiskSizeGB}` : '')}` : '') +
    (net.vnet_opt === 'custom' ? ' \\\n   custom_vnet=true' : '') +
    (net.vnet_opt === 'byo' ? ` \\\n   byoAKSSubnetId=${net.byoAKSSubnetId}` : '') +
    (net.vnet_opt === 'byo' && addons.ingress === 'appgw' ? ` \\\n   byoAGWSubnetId=${net.byoAGWSubnetId}` : '') +
    (cluster.enable_aad ? ` \\\n   enable_aad=true ${(cluster.enableAzureRBAC === false && cluster.aad_tenant_id ? `aad_tenant_id=${cluster.aad_tenant_id}` : '')}` : '') +
    (cluster.enable_aad && cluster.enableAzureRBAC ? ` \\\n   enableAzureRBAC=true ${(cluster.adminprincipleid ? `adminprincipleid=${cluster.adminprincipleid}` : '')}` : '') +
    (addons.registry !== 'none' ? ` \\\n   registries_sku=${addons.registry}` : '') +
    (net.afw ? ` \\\n   azureFirewalls=true` : '') +
    (net.serviceEndpointsEnable && net.serviceEndpoints.size > 0 ? ` \\\n   serviceEndpoints="${JSON.stringify(Array.from(net.serviceEndpoints).map(s => { return { service: s } })).replaceAll('"', '\\"')}"` : '') +
    (addons.monitor === 'aci' ? ` \\\n   omsagent=true retentionInDays=${addons.retentionInDays}` : "") +
    (addons.networkPolicy !== 'none' ? ` \\\n   networkPolicy=${addons.networkPolicy}` : '') +
    (addons.azurepolicy !== 'none' ? ` \\\n   azurepolicy=${addons.azurepolicy}` : '') +
    (net.networkPlugin !== 'azure' ? ` \\\n   networkPlugin=${net.networkPlugin}` : '') +
    (cluster.availabilityZones === 'yes' ? ` \\\n   availabilityZones="${JSON.stringify(['1', '2', '3']).replaceAll(' ', '').replaceAll('"', '\\"')}"` : '') +
    (cluster.apisecurity === 'whitelist' && apiips_array.length > 0 ? ` \\\n   authorizedIPRanges="${JSON.stringify(apiips_array).replaceAll(' ', '').replaceAll('"', '\\"')}"` : '') +
    (cluster.apisecurity === 'private' ? ` \\\n   enablePrivateCluster=true` : '') +
    (addons.dns && addons.dnsZoneId ? ` \\\n   dnsZoneId=${addons.dnsZoneId}` : '') +
    (addons.ingress === 'appgw' ? ` \\\n   ingressApplicationGateway=true` : '')

  const preview_features =
    (cluster.upgradeChannel !== 'none' ? ` \\\n   upgradeChannel=${cluster.upgradeChannel}` : '') +
    (addons.gitops !== 'none' ? ` \\\n   gitops=${addons.gitops}` : '') +
    (net.serviceEndpointsEnable && net.serviceEndpoints.has('Microsoft.ContainerRegistry') && addons.registry === 'Premium' ? ` \\\n   ACRserviceEndpointFW=${apiips_array.length > 0 ? apiips_array[0] : 'vnetonly'}` : '')

  const deploycmd = armcmd + (deploy.disablePreviews ? '' : preview_features)

  const postscript_woraround = `# Workaround to enabling the appgw addon with custom vnet
  az aks enable-addons -n ${deploy.clusterName} -g ${deploy.clusterName}-rg -a ingress-appgw --appgw-id $(az network application-gateway show -g ${deploy.clusterName}-rg -n ${deploy.clusterName}-appgw --query id -o tsv)
  `
  const promethous_namespace = 'monitoring'
  const promethous_helm_release_name = 'monitoring'
  const nginx_namespace = 'ingress-basic'
  const nginx_helm_release_name = 'nginx-ingress'

  const postscript = ((net.vnet_opt === 'custom' || net.afw || (net.serviceEndpointsEnable && net.serviceEndpoints.size > 0)) ? postscript_woraround : '') +
    `# Get admin credentials for your new AKS cluster
  az aks get-credentials -g ${deploy.clusterName}-rg -n ${deploy.clusterName} --admin ` +

    (addons.monitor === 'oss' ? `\n\n# Install kube-prometheus-stack
  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
  helm repo update
  kubectl create namespace ${promethous_namespace}
  helm install ${promethous_helm_release_name} prometheus-community/kube-prometheus-stack --namespace ${promethous_namespace}` : '') +

    (addons.ingress === 'nginx' ? `\n\n# Create a namespace for your ingress resources
  kubectl create namespace ${nginx_namespace}
  
  # Add the ingress-nginx repository
  helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
  
  # Use Helm to deploy an NGINX ingress controller
  helm install ${nginx_helm_release_name} ingress-nginx/ingress-nginx \\
    --set controller.publishService.enabled=true \\
  ` + (addons.ingressEveryNode ?
        `  --set controller.kind=DaemonSet \\
    --set controller.service.externalTrafficPolicy=Local \\
  ` : '') +
      (addons.monitor === 'oss' ?
        `  --set controller.metrics.enabled=true \\
    --set controller.metrics.serviceMonitor.enabled=true \\
    --set controller.metrics.serviceMonitor.namespace=${promethous_namespace} \\
    --set controller.metrics.serviceMonitor.additionalLabels.release=${promethous_helm_release_name} \\
  ` : '') +
      `  --namespace ${nginx_namespace}` : '') +

    (addons.dnsZoneId ? `\n\n# Install external-dns
  kubectl create secret generic azure-config-file --from-file=azure.json=/dev/stdin<<EOF
  {
    "userAssignedIdentityID": "$(az aks show -g ${deploy.clusterName}-rg -n ${deploy.clusterName} --query identityProfile.kubeletidentity.clientId -o tsv)",
    "tenantId": "$(az account show --query tenantId -o tsv)",
    "useManagedIdentityExtension": true,
    "subscriptionId": "${addons.dnsZoneId.split('/')[2]}",
    "resourceGroup": "${addons.dnsZoneId.split('/')[4]}"
  }
  EOF
  
  curl https://raw.githubusercontent.com/khowling/aks-deploy-arm/master/cluster-config/external-dns.yml | sed '/- --provider=azure/a\\            - --domain-filter=${addons.dnsZoneId.split('/')[8]}' | kubectl apply -f -` : '') +

    (addons.certEmail ? `\n\n# Install cert-manager
  kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.1.0/cert-manager.yaml
  
  sleep 30s
  
  cat <<EOF | kubectl create -f -
  apiVersion: cert-manager.io/v1
  kind: ClusterIssuer
  metadata:
    name: letsencrypt-prod
  spec:
    acme:
      # The ACME server URL
      server: https://acme-v02.api.letsencrypt.org/directory
      # Email address used for ACME registration
      email: "${addons.certEmail}"
      # Name of a secret used to store the ACME account private key
      privateKeySecretRef:
        name: letsencrypt-prod
      # Enable the HTTP-01 challenge provider
      solvers:
      - http01:
          ingress:
            class: ${(addons.ingress === 'nginx' ? "nginx" : "azure/application-gateway")}
  EOF
  ` : '')

  return (

    <Stack tokens={{ childrenGap: 15 }} styles={adv_stackstyle}>
      <Stack horizontal styles={{ root: { width: "100%" } }} tokens={{ childrenGap: 150 }}>
        <Stack styles={{ root: { width: "300px" } }}>

          <TextField label="Cluster Name" onChange={(ev, val) => updateFn('clusterName', val)} required errorMessage={invalidArray.includes('clusterName') ? "Enter valid cluster name" : ""} value={deploy.clusterName} />
          <Dropdown
            label="Location"
            selectedKey={deploy.location}
            onChange={(ev, { key }) => updateFn('location', key)}
            options={[
              { key: 'europe', text: 'Europe', itemType: DropdownMenuItemType.Header },
              { key: "WestEurope", text: "West Europe" },
              { key: "NorthEurope", text: "North Europe" },
              { key: "UKSouth", text: "UK South" },
              { key: "UKSouth2", text: "UK South2" },
              { key: "UKWest", text: "UK West" },
              { key: 'america', text: 'North America', itemType: DropdownMenuItemType.Header },
              { key: "CentralUS", text: "Central US" },
              { key: "EastUS", text: "East US" },
              { key: "EastUS2", text: "East US2" },
              { key: "WestUS", text: "West US" },
              { key: "WestUS2", text: "West US2" },
              { key: "WestCentralUS", text: "West Central US" }
            ]}
            styles={{ dropdown: { width: 300 } }}
          />
        </Stack>
        <Stack tokens={{ childrenGap: 20 }} styles={{ root: { width: "450px" } }}>
          <TextField label="Kubernetes version" readOnly={true} disabled={true} value={process.env.REACT_APP_K8S_VERSION} />

          <Stack.Item styles={{ root: { display: (cluster.apisecurity !== "whitelist" ? "none" : "block") } }} >
            <TextField label="Initial api server whitelisted IPs/CIDRs  (',' seperated)" errorMessage={invalidArray.includes('apiips') ? "Enter an IP/CIDR, or disable API Security in 'Cluster Details' tab" : ""} onChange={(ev, val) => updateFn("apiips", val)} value={deploy.apiips} required={cluster.apisecurity === "whitelist"} />
          </Stack.Item>

        </Stack>



      </Stack>
      {/*
          { (addons.ingress === 'none' || !addons.dns || !addons.certMan) &&
            <MessageBar messageBarType={MessageBarType.info}>To enable the option of deploying a <b>Demo Ecommerce App</b>, go to the <b>Application Requirements</b> tab, and select an ingress option (Application Gateway or Nginx), and complete the FQDN and Certificate options</MessageBar>
          }
          <Toggle
            disabled={(addons.ingress === 'none' || !addons.dns || !addons.certMan)}
            label={<Text>Do you want to install the <Link target="_a" href="https://github.com/khowling/aks-ecomm-demo">Demo Ecommerce App</Link> into your cluster with a HTTPS FQDN exposed through an Ingress controller</Text>}
            checked={deploy.demoapp} onText="Yes" offText="No" onChange={(ev, checked) => updateFn("demoapp", checked)} />
        */}

      <Separator styles={{ root: { marginTop: '30px !important' } }}><div style={{ display: "flex", alignItems: 'center', }}><b style={{ marginRight: '10px' }}>Deploy Cluster</b><Image src="./bicep.png" /> <p style={{ marginLeft: '10px' }}>powered by Bicep</p></div> </Separator>

      {preview_features.length > 0 &&
        <MessageBar messageBarType={MessageBarType.warning}>
          <Text >Your deployment contains Preview features: <b>{preview_features}</b>, Ensure you have registered for ALL these previews before running the script, <Link target="_pv" href="https://github.com/Azure/AKS/blob/master/previews.md">see here</Link>, or disable preview features here</Text>
          <Toggle styles={{ root: { marginTop: "10px" } }} onText='preview enabled' offText="preview disabled" checked={!deploy.disablePreviews} onChange={(ev, checked) => updateFn("disablePreviews", !checked)} />
        </MessageBar>

      }
      {/* (addons.monitor === 'oss' || addons.ingress === 'nginx') &&
          <MessageBar messageBarType={MessageBarType.warning}>
            <Text >Your deployment contains Opensource community solutions, these solutions are not managed by Microsoft, you will be responsible for managing the lifecycle of these solutions</Text>
          </MessageBar>
  
      */}
      <TextField readOnly={true} label="Commands to deploy your fully operational environment" styles={{ root: { fontFamily: 'SFMono-Regular,Consolas,Liberation Mono,Menlo,Courier,monospace!important' }, field: { backgroundColor: 'lightgrey', lineHeight: '21px' } }} multiline rows={deploycmd.split(/\r\n|\r|\n/).length + 1} value={deploycmd} errorMessage={!allok ? "Please complete all items that need attention before running script" : ""} />

      <Text styles={{ root: { marginTop: "2px !important" } }} variant="medium" >Open a Linux shell (requires 'az cli' pre-installed), or, open the <Link target="_cs" href="http://shell.azure.com/">Azure Cloud Shell</Link>. <Text variant="medium" style={{ fontWeight: "bold" }}>Paste the commands</Text> into the shell</Text>

      <Separator styles={{ root: { marginTop: '30px !important' } }}><b>Next Steps</b></Separator>

      {addons.gitops === 'none' ?
        <Stack>
          <Label>Run these commands to install the requeted kubernetes packages into your cluster</Label>
          <MessageBar>Once available, we will switch to using the gitops addon here, to assure that your clusters get their source of truth from the defined git repo</MessageBar>
          <TextField readOnly={true} label="Commands (requires helm)" styles={{ root: { fontFamily: 'SFMono-Regular,Consolas,Liberation Mono,Menlo,Courier,monospace!important' }, field: { backgroundColor: 'lightgrey', lineHeight: '21px' } }} multiline rows={postscript.split(/\r\n|\r|\n/).length + 1} value={postscript} />
        </Stack>
        :
        <Stack>

          <TextField readOnly={true} label="While Gitops is in preview, run this manually" styles={{ root: { fontFamily: 'SFMono-Regular,Consolas,Liberation Mono,Menlo,Courier,monospace!important' }, field: { backgroundColor: 'lightgrey', lineHeight: '21px' } }} multiline rows={6} value={`az k8sconfiguration create
       --name cluster-config 
       --cluster-name ${deploy.clusterName}    
       --resource-group ${deploy.clusterName}-rg     
       --operator-instance-name flux     
       --operator-namespace cluster-config     
       --enable-helm-operator     
       --operator-params='--git-readonly --git-path=cluster-config'     
       --repository-url git://github.com/khowling/aks-deploy-arm.git     
       --scope cluster     
       --helm-operator-params='--set helm.versions=v3'     
       --cluster-type managedclusters`} />

        </Stack>
      }

    </Stack>
  )
}