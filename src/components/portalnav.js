
import React, { useState, useEffect } from 'react';
import { Fabric, mergeStyles, Image, FontIcon, Pivot, PivotItem, TextField, Icon, Link, Separator, DropdownMenuItemType, Dropdown, Slider, DirectionalHint, Callout, Stack, Text, Toggle, Label, ChoiceGroup, Checkbox, MessageBar, MessageBarType } from '@fluentui/react';

import { Card } from '@uifabric/react-cards'
import { appInsights } from '../index.js'

import { initializeIcons } from '@uifabric/icons';
initializeIcons();


const optionRootClass = mergeStyles({
  display: 'flex',
  alignItems: 'baseline'
});

const adv_stackstyle = { root: { border: "1px solid", background: "#fcfcfc", margin: "10px 0", padding: "15px", height: "2000px" } }

const iconClass = mergeStyles({
  fontSize: 80,
  height: 100,
  //width: 150,
  margin: '0 80px',
});

function useAITracking(componentName, key) {

  useEffect(() => {
    const start = new Date(), pagename = `${componentName}.${key}`
    appInsights.startTrackPage(pagename)
    return () => {
      console.log(`exit screen ${key} ${(new Date() - start) / 1000}`)
      appInsights.stopTrackPage(pagename,
        { 'Component Name': componentName, 'Navigation': key },
        { mounttime: (new Date() - start) / 1000 })
    };
  }, [componentName, key])

}

function set_imm_del(prev, val) {
  let ns = new Set(prev)
  ns.delete(val)
  return ns
}

function set_imm_add(prev, val) {
  return new Set(prev).add(val)
}

export default function PortalNav() {
  const [key, setKey] = useState("0")
  const [defaultCluster, setDefaultCluster] = useState("managed")
  const [defaultSecurity, setDefaultSecurity] = useState("normal")

  const navScreenHeader = ["Cluster Details", "Addon Details", "Networking Details", "Deploy"]

  useAITracking("PortalNav", navScreenHeader[key])
  const [invalidArray, setInvalidArray] = useState({
    deploy: [],
    net: [],
    cluster: [],
    addons: []
  })
  const [cluster, setCluster] = useState({
    //securityLevel: "normal",
    apisecurity: 'none',
    autoscale: false,
    upgradeChannel: 'none',
    count: 2,
    maxCount: 20,
    vmSize: "Standard_DS3_v2",
    osDiskSizeGB: 0,
    osDiskType: "Ephemperal",
    enable_aad: true,
    use_alt_aad: false,
    aad_tenant_id: "",
    enableAzureRBAC: true,
    adminprincipleid: '',
    aadgroupids: '',
    availabilityZones: 'no'
  })
  const [addons, setAddons] = useState({
    networkPolicy: 'none',
    azurepolicy: 'none',
    ingress: 'none',
    ingressEveryNode: false,
    certMan: false,
    certEmail: "",
    dns: false,
    dnsZoneId: "",
    registry: 'none',
    podid: false,
    podscale: false,
    monitor: "none",
    retentionInDays: 30,
    gitops: 'none'
  })
  const [net, setNet] = useState({
    networkPlugin: 'azure',
    afw: false,
    vnetprivateend: false,
    serviceEndpointsEnable: false,
    serviceEndpoints: new Set(),
    custom_vnet: false,
    vnet: "10.0.0.0/8",
    akssub: "10.240.0.0/16",
    ilbsub: "10.241.0.0/24",
    afwsub: "10.241.0.0/24",
    ersub: "10.242.0.0/24",
    agsub: "10.241.0.0/24",
    podCidr: "10.244.0.0/16",
    service: "10.0.0.0/16"
  })
  //const [app, setApp] = useState({
  //  keyvaultcsi: false
  //})
  const [deploy, setDeploy] = useState({
    clusterName: `az-k8s-${(Math.floor(Math.random() * 900000) + 100000).toString(36)}`,
    location: "WestEurope",
    apiips: '',
    demoapp: false,
    disablePreviews: true
  })

  useEffect(() => {
    setOperationsManaged()
    setSecurityNormal()
    setNet((prev) => { return { ...prev, serviceEndpoints: set_imm_add(prev.serviceEndpoints, 'Microsoft.ContainerRegistry') } })

    fetch('https://api.ipify.org?format=json').then(response => {
      return response.json();
    }).then((res) => {
      setDeploy((prev) => { return { ...prev, apiips: res.ip } })
    }).catch((err) => console.error('Problem fetching my IP', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function setOperationsManaged() {
    setDefaultCluster('managed')
    setCluster((prev) => { return { ...prev, autoscale: true, upgradeChannel: 'stable' } })
    setAddons((prev) => { return { ...prev, registry: (net.vnetprivateend || net.serviceEndpointsEnable) ? 'Premium' : 'Basic', ingress: 'appgw', monitor: 'aci' } })
    setNet((prev) => { return { ...prev, serviceEndpoints: prev.serviceEndpointsEnable ? set_imm_add(prev.serviceEndpoints, 'Microsoft.ContainerRegistry') : set_imm_del(prev.serviceEndpoints, 'Microsoft.ContainerRegistry') } })
  }
  function setSecurityNormal() {
    setDefaultSecurity('normal')
    setCluster((prev) => { return { ...prev, enable_aad: true, apisecurity: 'whitelist' } })
    setAddons((prev) => { return { ...prev, networkPolicy: 'calico', registry: prev.registry !== 'none' ? 'Premium' : 'none', azurepolicy: 'audit' } })
    setNet((prev) => { return { ...prev, serviceEndpointsEnable: true, vnetprivateend: false, afw: false } })
  }


  function _handleLinkClick(item) {
    setKey(item.props.itemKey)
  }

  function mergeState(fn, state, key, val) {
    fn({ ...state, [key]: val })
  }



  function invalidFn(page, key, invalid) {

    if (!invalid && invalidArray[page].includes(key)) {
      setInvalidArray((prev) => { return { ...prev, [page]: prev[page].filter((v) => v !== key) } })
    } else if (invalid && !invalidArray[page].includes(key)) {
      setInvalidArray((prev) => { return { ...prev, [page]: prev[page].concat(key) } })
    }
  }

  invalidFn('deploy', 'clusterName', deploy.clusterName.match(/^[a-z0-9][_\-a-z0-9]+[a-z0-9]$/i) === null)
  invalidFn('cluster', 'osDiskType', cluster.osDiskType === 'Ephemperal' && !VMs.find(i => i.key === cluster.vmSize).eph)
  invalidFn('cluster', 'aad_tenant_id', cluster.enable_aad && cluster.use_alt_aad && cluster.aad_tenant_id.length !== 36)
  //invalidFn('net', 'serviceEndpoints', net.serviceEndpointsEnable && net.serviceEndpoints.size === 0)
  invalidFn('addons', 'registry', (net.vnetprivateend || net.serviceEndpointsEnable) && (addons.registry !== 'Premium' && addons.registry !== 'none'))
  invalidFn('deploy', 'apiips', cluster.apisecurity === 'whitelist' && deploy.apiips.length < 7)
  invalidFn('addons', 'dnsZoneId', addons.dns && !addons.dnsZoneId.match('^/subscriptions/[^/ ]+/resourceGroups/[^/ ]+/providers/Microsoft.Network/dnszones/[^/ ]+$'))
  invalidFn('addons', 'certEmail', addons.certMan && !addons.certEmail.match('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$'))

  function _customRenderer(page, link, defaultRenderer) {
    return (
      <span>
        { invalidArray[page].length > 0 &&
          <Icon iconName="Warning12" style={{ color: 'red' }} />
        }
        {defaultRenderer(link)}
      </span>
    );
  }

  return (
    <Fabric>
      <main id="mainContent" className="wrapper">
        <Stack horizontal tokens={{ childrenGap: 10 }}>
          <img src="aks.svg" alt="Kubernetes Service" style={{ width: "6%", height: "auto" }}></img>
          <Stack tokens={{ padding: 10 }}>
            <Text variant="xLarge">AKS Deploy helper</Text>
            <Text >Tell us the requirements of your AKS deployment, and we will generate the configuration to create a full operational environment, incorporating best-practics guidence </Text>
          </Stack>
        </Stack>

        <Stack verticalFill styles={{ root: { width: '960px', margin: '0 auto', color: 'grey' } }}>

          <Separator styles={{ root: { margin: "15px 0" } }}><b>Operations Principles</b></Separator>

          <Stack horizontal tokens={{ childrenGap: 30 }}>

            <Card
              onClick={() => {
                setDefaultCluster('none')
                setCluster((prev) => { return { ...prev, autoscale: false, upgradeChannel: 'none' } })
                setAddons((prev) => { return { ...prev, registry: 'none', ingress: 'none', monitor: 'none' } })
                setNet((prev) => { return { ...prev, serviceEndpoints: set_imm_del(prev.serviceEndpoints, 'Microsoft.ContainerRegistry') } })
              }}
              tokens={{ childrenMargin: 12 }}
            >
              <Card.Item>
                <ChoiceGroup selectedKey={defaultCluster} options={[{ key: 'none', text: 'Simplest bare-bones cluster', styles: { root: { fontWeight: defaultCluster === 'none' ? '500' : 'normal' } } }]} />
              </Card.Item>

              <Card.Item>
                <FontIcon iconName="Manufacturing" className={iconClass} />
              </Card.Item>

              <Card.Item styles={{ root: { marginTop: '0px !important' } }}>
                <div style={{ fontSize: "12px" }} >Just kubernetes please, I will make desisions later
              </div>
              </Card.Item>
            </Card>

            <Card
              onClick={() => {
                setDefaultCluster('oss')
                setCluster((prev) => { return { ...prev, autoscale: false, upgradeChannel: 'none' } })
                setAddons((prev) => { return { ...prev, registry: 'none', ingress: 'nginx', monitor: 'oss' } })
                setNet((prev) => { return { ...prev, serviceEndpoints: set_imm_del(prev.serviceEndpoints, 'Microsoft.ContainerRegistry') } })
              }}
              tokens={{ childrenMargin: 12 }}
            >
              <Card.Item>
                <ChoiceGroup selectedKey={defaultCluster} options={[{ key: 'oss', text: 'I prefer control & commuity opensource soltuions', styles: { root: { fontWeight: defaultCluster === 'oss' ? '500' : 'normal' } } }]} />
              </Card.Item>

              <Card.Item>
                <FontIcon iconName="DeveloperTools" className={iconClass} />
              </Card.Item>

              <Card.Item styles={{ root: { marginTop: '0px !important' } }}>
                <div style={{ fontSize: "12px" }} >Use proven, opensource projects for my Kubernetes operational environment, and self-manage my clusters upgrades and scalling
              <ul>
                    <li>Manual Upgrades</li>
                    <li>Manual Scalling</li>
                    <li>Nginx Ingress (<a target="_nsg" href="https://kubernetes.github.io/ingress-nginx/">docs</a>)</li>
                    <li>Promethous/Grahana Monitoring (<a target="_nsg" href="https://coreos.com/operators/prometheus/docs/latest/user-guides/getting-started.html">docs</a>)</li>
                    <li>Dockerhub container registry</li>
                  </ul>
                </div>
              </Card.Item>
            </Card>

            <Card
              onClick={setOperationsManaged}
              tokens={{ childrenMargin: 12 }}
            >
              <Card.Item>
                <ChoiceGroup selectedKey={defaultCluster} options={[{ key: 'managed', text: 'I want a managed environment (Recommended for most)', styles: { root: { fontWeight: defaultCluster === 'managed' ? '500' : 'normal' } } }]} />
              </Card.Item>

              <Card.Item>
                <FontIcon iconName="Touch" className={iconClass} />
              </Card.Item>

              <Card.Item styles={{ root: { marginTop: '0px !important' } }}>
                <div style={{ fontSize: "12px" }} >
                  I'd like my cluster to be auto-managed by Azure for upgrades and scalling, and use Azure provided managed addons to create an full environment with the minimum of operational requirements
              <ul>
                    <li>Cluster auto-scaller (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/aks/cluster-autoscaler">docs</a>)</li>
                    <li>Cluser auto-upgrades** (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/aks/upgrade-cluster#set-auto-upgrade-channel">docs</a>)</li>
                    <li>Azure Monitor for Containers (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/azure-monitor/insights/container-insights-overview">docs</a>)</li>
                    <li>Azure Container Registry</li>
                    <li>Azure AppGateway Ingress** (<a target="_nsg" href="https://docs.microsoft.com/en-gb/azure/application-gateway/ingress-controller-overview">docs</a>)</li>
                  </ul>
                </div>
              </Card.Item>
            </Card>
          </Stack>


          <Separator styles={{ root: { marginTop: "15px !important", marginBottom: "15px" } }}><b>Security Principles</b></Separator>

          <Stack horizontal tokens={{ childrenGap: 30 }}>

            <Card
              onClick={() => {
                setDefaultSecurity('low')
                setCluster((prev) => { return { ...prev, enable_aad: false, apisecurity: 'none' } })
                setAddons((prev) => { return { ...prev, networkPolicy: 'none', registry: prev.registry !== 'none' ? 'Basic' : 'none', azurepolicy: 'none' } })
                setNet({ ...net, serviceEndpointsEnable: false, vnetprivateend: false, afw: false })
              }}
              tokens={{ childrenMargin: 12 }}
            >
              <Card.Item>
                <ChoiceGroup selectedKey={defaultSecurity} options={[{ key: 'low', text: 'Simple cluster with no additional access limitations', styles: { root: { fontWeight: defaultSecurity === 'low' ? '500' : 'normal' } } }]} />
              </Card.Item>
              <Card.Item>
                <FontIcon iconName="Unlock" className={iconClass} />
              </Card.Item>
              <Card.Section>
                <div style={{ fontSize: "12px" }} >Simplest option for experimenting with kubernetes, or clusters with no sensitive data
              </div>
              </Card.Section>
            </Card>

            <Card
              onClick={setSecurityNormal}
              tokens={{ childrenMargin: 12 }}
            >
              <Card.Item>
                <ChoiceGroup selectedKey={defaultSecurity} options={[{ key: 'normal', text: 'Custer with additional security controls (Recommended for most)', styles: { root: { fontWeight: defaultSecurity === 'normal' ? '500' : 'normal' } } }]} />
              </Card.Item>
              <Card.Item>
                <FontIcon iconName="Lock12" className={iconClass} />
              </Card.Item>
              <Card.Item>
                <div style={{ fontSize: "12px" }} >Good option for implmenting recommended minimum security controls for regular environments
              <ul>
                    <li>AAD Integration (<a target="_nsg" href="https://docs.microsoft.com/en-gb/azure/aks/managed-aad">docs</a>)</li>
                    <li>AUDIT Pod security baseline standards (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/governance/policy/concepts/policy-for-kubernetes">docs</a>)</li>
                    <li>East-West traffic control (<a target="_nsg" href="https://docs.microsoft.com/en-gb/azure/aks/use-network-policies">docs</a>)</li>
                    <li>Authorized IP address ranges (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/aks/api-server-authorized-ip-ranges">docs</a>)</li>
                    <li>Firewall dependencies with Service Endpoints (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/virtual-network/virtual-network-service-endpoints-overview">docs</a>)</li>
                  </ul>
                </div>
              </Card.Item>
            </Card>

            <Card
              onClick={() => {
                setDefaultSecurity('high')
                setCluster({ ...cluster, enable_aad: true, apisecurity: 'private' })
                setAddons((prev) => { return { ...prev, networkPolicy: 'calico', registry: prev.registry !== 'none' ? 'Premium' : 'none', azurepolicy: 'deny' } })
                setNet({ ...net, serviceEndpointsEnable: false, vnetprivateend: true, afw: true })
              }}
              tokens={{ childrenMargin: 12 }}
            >
              <Card.Item>
                <ChoiceGroup selectedKey={defaultSecurity} options={[{ key: 'high', text: 'Private cluster with isolating networking controls', styles: { root: { fontWeight: defaultSecurity === 'high' ? '500' : 'normal' } } }]} />
              </Card.Item>

              <Card.Item>
                <FontIcon iconName="ProtectionCenterLogo32" className={iconClass} />
              </Card.Item>
              <Card.Item>
                <div style={{ fontSize: "12px" }} >
                  Best option for high-secure, regulated environments or sensitive data requirements.  <Icon iconName="Warning12" style={{ color: 'red' }} />WARNING: most complex environment option to operate

                <ul>
                    <li>AAD Integration (<a target="_nsg" href="https://docs.microsoft.com/en-gb/azure/aks/managed-aad">docs</a>)</li>
                    <li>ENFORCE Pod security baseline standards (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/governance/policy/concepts/policy-for-kubernetes">docs</a>)</li>
                    <li>East-West traffic control (<a target="_nsg" href="https://docs.microsoft.com/en-gb/azure/aks/use-network-policies">docs</a>)</li>
                    <li>Private cluster (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/aks/private-clusters">docs</a>)</li>
                    <li>Private Link dependencies (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/private-link/private-link-overview">docs</a>)</li>
                    <li>Restrict egress with Azure firewall (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/aks/limit-egress-traffic#restrict-egress-traffic-using-azure-firewall">docs</a>)</li>
                    {/*  <li>Confidential computing nodes (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/confidential-computing/confidential-nodes-aks-overview">docs</a>)</li>
                */}
                  </ul>
                </div>
              </Card.Item>
            </Card>
          </Stack>

          <Separator styles={{ root: { marginTop: "15px !important", marginBottom: "5px" } }}><b>Deploy</b> (optionally use 'Details' tabs for additional configuration)</Separator>

          <Pivot selectedKey={key} onLinkClick={_handleLinkClick}>
            <PivotItem headerText={navScreenHeader[3]} itemKey="0" onRenderItemLink={(a, b) => _customRenderer('deploy', a, b)}>
              <DeployScreen net={net} addons={addons} cluster={cluster} deploy={deploy} updateFn={(key, val) => mergeState(setDeploy, deploy, key, val)} invalidArray={invalidArray['deploy']} allok={Object.values(invalidArray).reduce((a, i) => a + i.length, 0) === 0} />

            </PivotItem>
            <PivotItem headerText={navScreenHeader[0]} itemKey="1" onRenderItemLink={(a, b) => _customRenderer('cluster', a, b)} >
              <ClusterScreen cluster={cluster} updateFn={(key, val) => mergeState(setCluster, cluster, key, val)} invalidArray={invalidArray['cluster']} />
            </PivotItem>
            <PivotItem headerText={navScreenHeader[1]} itemKey="2" onRenderItemLink={(a, b) => _customRenderer('addons', a, b)} >
              <AddonsScreen cluster={cluster} addons={addons} net={net} updateFn={(key, val) => mergeState(setAddons, addons, key, val)} invalidArray={invalidArray['addons']} />
            </PivotItem>
            <PivotItem headerText={navScreenHeader[2]} itemKey="3" onRenderItemLink={(a, b) => _customRenderer('net', a, b)}>
              <NetworkScreen net={net} addons={addons} cluster={cluster} updateFn={(key, val) => mergeState(setNet, net, key, val)} invalidArray={invalidArray['net']} />
            </PivotItem>

          </Pivot>

        </Stack>
      </main>
    </Fabric>

  )
}

function DeployScreen({ updateFn, net, addons, cluster, deploy, invalidArray, allok }) {
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
    (net.custom_vnet ? ' \\\n   custom_vnet=true' : '') +
    (cluster.enable_aad ? ` \\\n   enable_aad=true ${(cluster.enableAzureRBAC === false && cluster.aad_tenant_id ? `aad_tenant_id=${cluster.aad_tenant_id}` : '')}` : '') +
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
    (cluster.enable_aad && cluster.enableAzureRBAC ? ` \\\n   enableAzureRBAC=true ${(cluster.adminprincipleid ? `adminprincipleid=${cluster.adminprincipleid}` : '')}` : '') +
    (cluster.upgradeChannel !== 'none' ? ` \\\n   upgradeChannel=${cluster.upgradeChannel}` : '') +
    (addons.gitops !== 'none' ? ` \\\n   gitops=${addons.gitops}` : '') +
    (net.serviceEndpointsEnable && net.serviceEndpoints.has('Microsoft.ContainerRegistry') && addons.registry === 'Premium' ? ` \\\n   ACRserviceEndpointFW=${apiips_array.length > 0 ? apiips_array[0] : 'vnetonly'}` : '')

  const deploycmd = armcmd + (deploy.disablePreviews ? '' : preview_features)

  const postscript_woraround = `# Workaround to enabling the appgw addon with custom vnet
az aks enable-addons -n ${deploy.clusterName} -g ${deploy.clusterName}-rg -a ingress-appgw --appgw-id $(az network application-gateway show -g ${deploy.clusterName}-rg -n ${deploy.clusterName}-appgw --query id -o tsv)
`
  const postscript = ((net.custom_vnet || net.afw || (net.serviceEndpointsEnable && net.serviceEndpoints.size > 0)) ? postscript_woraround : '') +
    `# Get admin credentials for your new AKS cluster
az aks get-credentials -g ${deploy.clusterName}-rg -n ${deploy.clusterName} --admin ` +

    (addons.monitor === 'oss' ? `\n\n# Install kube-prometheus-stack
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
kubectl create namespace monitoring
helm install monitoring prometheus-community/kube-prometheus-stack --namespace monitoring` : '') +

    (addons.ingress === 'nginx' ? `\n\n# Create a namespace for your ingress resources
kubectl create namespace ingress-basic

# Add the ingress-nginx repository
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx

# Use Helm to deploy an NGINX ingress controller
helm install nginx-ingress ingress-nginx/ingress-nginx \\
  --set controller.publishService.enabled=true \\
` + (addons.ingressEveryNode ?
        `  --set controller.kind=DaemonSet \\
  --set controller.service.externalTrafficPolicy=Local \\
` : '') +
      (addons.monitor === 'oss' ?
        `  --set controller.metrics.enabled=true \\
  --set controller.metrics.serviceMonitor.enabled=true \\
` : '') +
      `  --namespace ingress-basic` : '') +

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

      { preview_features.length > 0 &&
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

      { addons.gitops === 'none' ?
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

const VMs = [
  { key: 'b', text: 'Burstable (dev/test)', itemType: DropdownMenuItemType.Header },
  { key: 'Standard_B2s', text: '2 vCPU,  4 GiB RAM,   8GiB SSD, 40%	-> 200% CPU', eph: true },
  { key: 'dv2', text: 'General purpose V2', itemType: DropdownMenuItemType.Header },
  { key: 'default', text: '2 vCPU,  7 GiB RAM,  14GiB SSD,  86 GiB cache (8000 IOPS)', eph: false },
  { key: 'Standard_DS3_v2', text: '4 vCPU, 14 GiB RAM,  28GiB SSD, 172 GiB cache (16000 IOPS)', eph: true },
  { key: 'dv4', text: 'General purpose V4', itemType: DropdownMenuItemType.Header },
  { key: 'Standard_D2ds_v4', text: '2 vCPU,  8 GiB RAM,  75GiB SSD,               (19000 IOPS)', eph: false },
  { key: 'Standard_D4ds_v4', text: '4 vCPU, 16 GiB RAM, 150GiB SSD, 100 GiB cache (38500 IOPS)', eph: false },
  { key: 'Standard_D8ds_v4', text: '8 vCPU, 32 GiB RAM, 300GiB SSD,               (77000 IOPS)', eph: true },
  { key: 'fv2', text: 'Compute optimized', itemType: DropdownMenuItemType.Header },
  { key: 'Standard_F2s_v2', text: '2 vCPU,  4 GiB RAM,  16GiB SSD,               (3200 IOPS)', eph: false }
]

function ClusterScreen({ cluster, updateFn, invalidArray }) {

  return (
    <Stack tokens={{ childrenGap: 15 }} styles={adv_stackstyle}>

      <Label style={{ marginBottom: "10px" }}>Cluster Performance & Scale Requirements (system nodepool)</Label>
      <Stack vertical tokens={{ childrenGap: 15 }} style={{ marginTop: 0, marginLeft: '50px' }} >

        <Stack horizontal tokens={{ childrenGap: 150 }}>
          <Stack.Item>
            <ChoiceGroup selectedKey={cluster.autoscale} onChange={(ev, { key }) => updateFn("autoscale", key)}
              options={[
                {
                  key: false,
                  iconProps: { iconName: 'FollowUser' },
                  text: 'Manual scale'
                }, {
                  key: true,
                  iconProps: { iconName: 'ScaleVolume' },
                  text: 'Autoscale'
                }
              ]} />
          </Stack.Item>
          <Stack.Item>
            <Stack tokens={{ childrenGap: 0 }} styles={{ root: { width: 450 } }}>
              <Slider label={`Initial ${cluster.autoscale ? "(& Autoscaler Min nodes)" : "nodes"}`} min={1} max={10} step={1} defaultValue={cluster.count} showValue={true}
                onChange={(v) => updateFn("count", v)} />
              {cluster.autoscale && (
                <Slider label="Autoscaler Max nodes" min={5} max={100} step={5} defaultValue={cluster.maxCount} showValue={true}
                  onChange={(v) => updateFn("maxCount", v)}
                  snapToStep />
              )}
            </Stack>
          </Stack.Item>
        </Stack>

        <Stack horizontal tokens={{ childrenGap: 55 }}>
          <Stack.Item>
            <Label >Compute Type</Label>
            <ChoiceGroup

              selectedKey="gp"
              options={[
                {
                  key: 'gp',
                  iconProps: { iconName: 'Processing' },
                  text: 'General Purpose'
                },
                {
                  key: 'iops',
                  iconProps: { iconName: 'OfflineStorageSolid' },
                  text: 'IO Optimised',
                  disabled: true
                },
                {
                  key: 'gpu',
                  iconProps: { iconName: 'Game' },
                  text: 'GPU Workloads',
                  disabled: true
                }
              ]} />
          </Stack.Item>

          <Stack.Item>
            <Label >Node Size</Label>
            <Stack tokens={{ childrenGap: 10 }} styles={{ root: { width: 450 } }}>
              <Dropdown

                selectedKey={cluster.vmSize}
                onChange={(ev, { key }) => updateFn("vmSize", key)}
                placeholder="Select VM Size"
                options={VMs}
                styles={{ dropdown: { width: "100%" } }}
              />

              {invalidArray.includes('osDiskType') && <MessageBar messageBarType={MessageBarType.error}>Youre selected VM cache is not large enough to support Ephemeral. Select 'Managed' or a VM with a larger cache</MessageBar>}
              <ChoiceGroup
                onChange={(ev, { key }) => updateFn("osDiskType", key)}
                selectedKey={cluster.osDiskType}
                options={[
                  {
                    key: 'Ephemperal',
                    text: 'Ephemperal (Requires Node with >137GiB of cache)'
                  },
                  {
                    key: 'Managed',
                    text: 'Persistant in Storage Account',
                  }
                ]} />

              {cluster.osDiskType === 'Managed' &&
                <Dropdown
                  label="OS disk size"
                  selectedKey={cluster.osDiskSizeGB}
                  onChange={(ev, { key }) => updateFn("osDiskSizeGB", key)}
                  placeholder="Select OS Disk"
                  options={[
                    { key: 'df', text: 'Use the default for the VM size', itemType: DropdownMenuItemType.Header },
                    { key: 0, text: 'default' },
                    { key: 'pd', text: 'Premium SSD Managed Disks', itemType: DropdownMenuItemType.Header },
                    { key: 32, text: '32 GiB (120 IOPS)' },
                    { key: 64, text: '64 GiB (240 IOPS)' },
                    { key: 128, text: '128 GiB (500 IOPS)' },
                  ]}
                  styles={{ dropdown: { width: "100%" } }}
                />
              }

            </Stack>
          </Stack.Item>
        </Stack>
      </Stack>

      <Separator className="notopmargin" />

      <Stack.Item align="start">
        <Label required={true}>Zone Support - Do you want to deploy your nodes across Availability Zones
          </Label>
        <ChoiceGroup
          selectedKey={cluster.availabilityZones}
          styles={{ root: { marginLeft: '50px' } }}
          options={[
            { key: 'no', text: 'Deploy into single zone' },
            { key: 'yes', text: 'Deploy my control plane and nodes across all availiability zones (**storage)' }

          ]}
          onChange={(ev, { key }) => updateFn("availabilityZones", key)}
        // styles={{ label: {fontWeight: "regular"}}}
        />
      </Stack.Item>

      <Separator className="notopmargin" />

      <Stack.Item align="start">
        <Label required={true}>
          Cluster Auto-upgrade
        </Label>
        <ChoiceGroup
          selectedKey={cluster.upgradeChannel}
          styles={{ root: { marginLeft: '50px' } }}
          options={[
            { key: 'none', text: 'Disables auto-upgrades' },
            { key: 'patch', text: 'Patch: auto-upgrade cluster to the latest supported patch version when it becomes available while keeping the minor version the same.' },
            { key: 'stable', text: 'Stable: auto-upgrade cluster to the latest supported patch release on minor version N-1, where N is the latest supported minor version' },
            { key: 'rapid', text: 'Rapid: auto-upgrade cluster to the latest supported patch release on the latest supported minor version.' }

          ]}
          onChange={(ev, { key }) => updateFn("upgradeChannel", key)}
        />
      </Stack.Item>

      <Separator className="notopmargin" />

      <Stack horizontal tokens={{ childrenGap: 142 }} styles={{ root: { marginTop: 10 } }}>
        <Stack.Item>
          <ChoiceGroup
            styles={{ root: { marginLeft: '50px' } }}
            label={<Label>Cluster User Authentication <Link target="_" href="https://docs.microsoft.com/en-gb/azure/aks/managed-aad">docs</Link></Label>}
            selectedKey={cluster.enable_aad}
            onChange={(ev, { key }) => updateFn("enable_aad", key)}
            options={[
              {
                key: false,
                iconProps: { iconName: 'UserWarning' },
                text: 'Kubernetes'
              },
              {
                key: true,
                iconProps: { iconName: 'AADLogo' },
                text: 'AAD Integrated'
              }
            ]} />
        </Stack.Item>

        <Stack.Item>
          {cluster.enable_aad &&

            <Stack tokens={{ childrenGap: 10 }} styles={{ root: { width: 450, marginTop: "30px" } }}>

              <ChoiceGroup
                styles={{ root: { width: 300 } }}
                selectedKey={cluster.use_alt_aad}
                options={[
                  {
                    key: false,
                    text: 'Use the AKS subscription tenant',
                  },
                  {
                    key: true,
                    text: 'Use alt. tenant',
                    onRenderField: (props, render) => {

                      return (
                        <div className={optionRootClass}>
                          {render(props)}
                          <TextField
                            value={cluster.aad_tenant_id}
                            onChange={(ev, val) => updateFn("aad_tenant_id", val)}
                            errorMessage={invalidArray.includes('aad_tenant_id') ? "Enter Valid Directory ID" : ""}
                            styles={{ root: { marginLeft: 5 } }}
                            disabled={props ? !cluster.use_alt_aad : false}
                            required placeholder="tenant id" />


                        </div>
                      );
                    }
                  }
                ]}
                onChange={(ev, { key }) => updateFn('use_alt_aad', key)}

              />

              <Checkbox checked={cluster.enableAzureRBAC} onChange={(ev, val) => updateFn("enableAzureRBAC", val)} onRenderLabel={() => <Text styles={{ root: { color: 'black' } }}>Azure RBAC for Kubernetes Authorization <Link target='_' href='https://docs.microsoft.com/en-us/azure/aks/manage-azure-rbac'>docs</Link>**</Text>} />

              {!cluster.enableAzureRBAC ?
                <>
                  <TextField label="AAD Group objectIDs that will have admin role of the cluster ',' seperated" onChange={(ev, val) => updateFn("aadgroupids", val)} value={cluster.aadgroupids} />
                  {cluster.enable_aad && !cluster.aadgroupids &&
                    <MessageBar messageBarType={MessageBarType.warning}>You will be forbidden to do any kubernetes options unless you add a AAD Groups here, or follow <Link target='_' href='https://docs.microsoft.com/en-us/azure/aks/azure-ad-rbac#create-the-aks-cluster-resources-for-app-devs'>this</Link> after the cluster is created</MessageBar>
                  }
                </>
                :
                <>
                  <Label>Assign Cluster Admin Role to user (optional)</Label>
                  <MessageBar styles={{ root: { marginBottom: '10px' } }}>Get your user principleId by running <Label>az ad user show --id `{'<work-email>'}` --query objectId --out tsv</Label></MessageBar>
                  <TextField prefix="AAD PrincipleId" onChange={(ev, val) => updateFn("adminprincipleid", val)} value={cluster.adminprincipleid} />
                </>
              }
            </Stack>
          }
        </Stack.Item>
      </Stack>

      <Separator className="notopmargin" />

      <Stack.Item align="start">
        <Label required={true}>
          Cluster API Server Secuity
        </Label>
        <ChoiceGroup
          selectedKey={cluster.apisecurity}
          styles={{ root: { marginLeft: '50px' } }}
          options={[
            { key: 'none', text: 'Public IP with no IP restrictions' },
            { key: 'whitelist', text: 'Create allowed IP ranges (defaults to IP address of machine running the script)' },
            { key: 'private', text: 'Private Cluster (WARNING: requires jummpbox to access)' }

          ]}
          onChange={(ev, { key }) => updateFn("apisecurity", key)}
        />
      </Stack.Item>

    </Stack>

  )
}


const columnProps = {
  tokens: { childrenGap: 15 },
  styles: { root: { width: 300 } }
}

function AddonsScreen({ cluster, addons, net, updateFn, invalidArray }) {

  return (
    <Stack tokens={{ childrenGap: 15 }} styles={adv_stackstyle}>

      <Stack.Item align="start">
        <Label >Cluster Monitoring requirements</Label>
        <MessageBar>Observing your clusters health is critical to smooth operations, select the managed Azure Monior for Containers option, or the opensource CNCF Promethous/Grafana solution</MessageBar>
        <ChoiceGroup
          styles={{ root: { marginLeft: '50px' } }}
          selectedKey={addons.monitor}
          options={[
            { key: 'none', text: 'None' },
            { key: 'aci', text: 'Azure Monitor for Containers (logs and metrics)' },
            { key: 'oss', text: 'Promethous / Grafana Helm Chart (metrics only)' }

          ]}
          onChange={(ev, { key }) => updateFn("monitor", key)}
        />
      </Stack.Item>

      <Stack.Item align="center" styles={{ root: { width: '600px', display: (addons.monitor !== "aci" ? "none" : "block") } }} >
        <Dropdown
          label="Log and Metrics Data Retention (Days)"
          onChange={(ev, val) => updateFn("retentionInDays", val)} selectedKey={addons.retentionInDays}
          options={[
            { key: 30, text: '30 Days' },
            { key: 60, text: '60 Days' },
            { key: 90, text: '90 Days' },
            { key: 120, text: '120 Days' },
            { key: 180, text: '180 Days' },
            { key: 270, text: '270 Days' },
            { key: 365, text: '365 Days' },
            { key: 270, text: '270 Days' },
            { key: 365, text: '365 Days' }
          ]}
        />
      </Stack.Item>

      <Separator className="notopmargin" />

      <Stack.Item align="start">

        <Label >Azure Policy, to manage and report on the compliance state of your Kubernetes clusters</Label>
        <MessageBar>Azure Policy extends Gatekeeper v3, an admission controller webhook for Open Policy Agent (OPA), to apply at-scale enforcements and safeguards on your clusters in a centralized, consistent manner.
        </MessageBar>
        <ChoiceGroup
          styles={{ root: { marginLeft: '50px' } }}
          selectedKey={addons.azurepolicy}
          options={[
            { key: 'none', text: 'No restrictions, users can deploy any kubernetes workloads' },
            { key: 'audit', text: 'AUDIT complience with the set of cluster pod security baseline standards for Linux-based workloads' },
            { key: 'deny', text: 'BLOCK and non-complient Linux-based workloads with the set of cluster pod security baseline standards' }
          ]}
          onChange={(ev, { key }) => updateFn("azurepolicy", key)}
        />
        {addons.azurepolicy !== 'none' &&
          <MessageBar messageBarType={MessageBarType.success} styles={{ root: { marginLeft: '50px', width: '700px' } }}>
            The template will automatically assign and <b>{addons.azurepolicy}</b> the following Policies:
          <ul>
              <li>Do not allow privileged containers in Kubernetes cluster</li>
              <li>Kubernetes cluster pods should only use approved host network and port range</li>
              <li>Kubernetes cluster containers should not share host process ID or host IPC namespace</li>
              <li>Kubernetes cluster containers should only use allowed capabilities</li>
              <li>Kubernetes cluster pod hostPath volumes should only use allowed host paths</li>
            </ul>
          </MessageBar>
        }
      </Stack.Item>
      <Separator className="notopmargin" />
      <Stack.Item align="start">
        <Label >Cluster East-West traffic restrictions (Network Policies)</Label>
        <MessageBar>Control which components can communicate with each other. The principle of least privilege should be applied to how traffic can flow between pods in an Azure Kubernetes Service (AKS) cluster</MessageBar>
        <ChoiceGroup
          styles={{ root: { marginLeft: '50px' } }}
          selectedKey={addons.networkPolicy}
          options={[
            { key: 'none', text: 'No restrictions, all PODs can access each other' },
            { key: 'calico', text: 'Use Network Pollicy addon with Calico to implemented intra-cluster traffic restrictions (driven from "NetworkPolicy" objects)' },
            { key: 'azure', text: 'Use Network Pollicy addon with Azure provider to implemented intra-cluster traffic restrictions (driven from "NetworkPolicy" objects)' }

          ]}
          onChange={(ev, { key }) => updateFn("networkPolicy", key)}
        />
      </Stack.Item>
      <Separator className="notopmargin" />
      <Stack.Item align="start">
        <Label required={true}>
          Securely Expose your applications via Layer 7 HTTP(S) proxies (Ingress Controller)
        </Label>
        <ChoiceGroup
          styles={{ root: { marginLeft: '50px' } }}
          selectedKey={addons.ingress}
          options={[
            { key: 'none', text: 'No, I will configure my own solution' },
            { key: 'nginx', text: 'Yes, deploy nginx in the cluster to expose my apps to the internet (nginx ingress controller)' },
            { key: 'appgw', text: 'Yes, I want a Azure Managed Application Gateway with WAF protection' }
          ]}
          onChange={(ev, { key }) => updateFn("ingress", key)}
        />
      </Stack.Item>

      <Stack.Item align="center" styles={{ root: { maxWidth: '700px', display: (addons.ingress === "none" ? "none" : "block") } }} >
        <Stack tokens={{ childrenGap: 15 }}>
          {addons.ingress === "nginx" && false &&
            <MessageBar messageBarType={MessageBarType.warning}>You requested a high security cluster & nginx public ingress. Please ensure you follow this information after deployment <Link target="_ar1" href="https://docs.microsoft.com/en-us/azure/firewall/integrate-lb#public-load-balancer">Asymmetric routing</Link></MessageBar>
          }
          {addons.ingress !== "none" && false &&
            <MessageBar messageBarType={MessageBarType.warning}>You requested a high security cluster. The DNS and Certificate options are disabled as they require additional egress application firewall rules for image download and webhook requirements. You can apply these rules and install the helm chart after provisioning</MessageBar>
          }

          {addons.ingress === "nginx" &&
            <Checkbox checked={addons.ingressEveryNode} onChange={(ev, v) => updateFn("ingressEveryNode", v)} label={<Text>Run nginx on every node (deploy as Daemonset)</Text>} />
          }

          {addons.ingress === "nginx" &&
            <>
              <Checkbox disabled={net.afw} checked={addons.dns} onChange={(ev, v) => updateFn("dns", v)} label={<Text>Create FQDN URLs for your applications using external-dns (Beta) (requires <Text style={{ fontWeight: "bold" }}>Azure DNS Zone</Text> - <Link href="https://docs.microsoft.com/en-us/azure/dns/dns-getstarted-portal#create-a-dns-zone" target="_t1">how to create</Link>)</Text>} />
              {addons.dns &&
                <>
                  <TextField disabled={net.afw} value={addons.dnsZoneId} onChange={(ev, v) => updateFn("dnsZoneId", v)} errorMessage={invalidArray.includes('dnsZoneId') ? "Enter valid resourceId" : ""} required placeholder="Resource Id" label={<Text style={{ fontWeight: 600 }}>Enter your Azure DNS Zone ResourceId <Link target="_t2" href="https://ms.portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.Network%2FdnsZones">find it here</Link></Text>} />


                  <Checkbox disabled={invalidArray.includes('dnsZoneId')} checked={addons.certMan} onChange={(ev, v) => updateFn("certMan", v)} label="Automatically Issue Certificates for HTTPS using cert-manager (with Lets Encrypt - requires email" />
                  {addons.certMan &&
                    <TextField value={addons.certEmail} onChange={(ev, v) => updateFn("certEmail", v)} errorMessage={invalidArray.includes('certEmail') ? "Enter valid email" : ''} label="Enter mail address for certificate notification:" required />
                  }
                </>
              }
            </>
          }
        </Stack>
      </Stack.Item>

      <Separator className="notopmargin" />

      <Stack.Item align="start">
        <Label required={true}>
          Do you require a secure private container registry to store my application images
        </Label>
        <ChoiceGroup
          styles={{ root: { marginLeft: '50px' } }}
          selectedKey={addons.registry}
          options={[
            { key: 'none', text: 'No, my application images will be on dockerhub or another registry' },
            { key: 'Basic', text: 'Yes, setup Azure Container Registry "Basic" tier & authorise aks to pull images' },
            { key: 'Standard', text: 'Yes, setup Azure Container Registry "Standard" tier (recommended for production)' },
            { key: 'Premium', text: 'Yes, setup Azure Container Registry "Premium" tier (required for Service Endpoints & Private Link)' }
          ]}
          onChange={(ev, { key }) => updateFn("registry", key)}
        />
        {invalidArray.includes('registry') &&
          <MessageBar messageBarType={MessageBarType.error}>Premium Teir is required for Service Endpoints & Private Link, either select "Premium", or disable Service Endpoints and Private Link</MessageBar>
        }
      </Stack.Item>

      <Separator className="notopmargin" />
      {/* 
      <ChoiceGroup
        label='Enable gitops'
        selectedKey={addons.gitops}
        options={[
          { key: 'none', text: 'No, I will manage my kubernetes deployments manually' },
          { key: 'yes', text: 'Yes, enable gitops' }
        ]}
        onChange={(ev, { key }) => updateFn("gitops", key)}
      />
      */}
    </Stack>
  )
}

/*
function ApplicationScreen({ cluster, addons, updateFn, invalidArray }) {

  return (
    <Stack tokens={{ childrenGap: 15 }} styles={adv_stackstyle}>

      <Label required={true}>
        My Application will use the following features (TBC)
        </Label>
      <Stack.Item align="start">
        <Stack tokens={{ childrenGap: 10 }}>
          <Checkbox checked={addons.keyvaultcsi} onChange={(ev, val) => updateFn("keyvaultcsi", val)} label="Store kubernetes secrets/certs encrypted in Aure KeyVault  (Azure KeyVault + CSI Driver)" />
          <Checkbox checked={addons.podid} onChange={(ev, val) => updateFn("podid", val)} label="My application will operate with an identity secured by Azure AD to access other services (pod identity)" />
          <Checkbox checked={addons.podscale} onChange={(ev, val) => updateFn("podscale", val)} label="Automatically set the 'requests'  based on usage and thus allow proper scheduling onto nodes (vertical-pod-autoscaler)" />
        </Stack>
      </Stack.Item>
    </Stack>
  )
}
*/


function NetworkScreen({ net, updateFn, addons, cluster, invalidArray }) {

  const [callout1, setCallout1] = useState(false)
  var _calloutTarget1 = React.createRef()


  return (
    <Stack tokens={{ childrenGap: 15 }} styles={adv_stackstyle}>

      <Toggle
        label="Network Plugin -Do you need to limit your non-routable IP usage on your network (use network calculator)"
        checked={net.networkPlugin === 'kubenet'}
        onText="Yes - Use 'kubenet' so your PODs do not receive VNET IPs"
        offText="No - Use 'CNI' for fastest container networking"
        onChange={(ev, val) => updateFn("networkPlugin", val ? 'kubenet' : 'azure')}
      // styles={{ label: {fontWeight: "regular"}}}
      />

      <Label>Setup Azure firewll for your cluster egress</Label>
      <Checkbox styles={{ root: { marginTop: '0 !important' } }} disabled={false} checked={net.afw} onChange={(ev, v) => updateFn("afw", v)} label="Implement Azure Firewall & UDR nexthop" />

      <Label>Secure Azure service resources to your virtual network by extending VNet identity to the service</Label>
      <Checkbox styles={{ root: { marginTop: '0 !important' } }} disabled={false} checked={net.serviceEndpointsEnable} onChange={(ev, v) => updateFn("serviceEndpointsEnable", v)} label="Enable Service Endpoints" />

      {net.serviceEndpointsEnable &&
        <Stack.Item align="center" styles={{ root: { minWidth: '600px' } }}>
          <Stack tokens={{ childrenGap: 10 }}>
            <MessageBar messageBarType={MessageBarType.info}>No Network Address Translation (NAT) or gateway devices required to access your Azure dependencies from your pods</MessageBar>

            <Dropdown
              required={true}
              placeholder="Select options"
              label="Select the Azure Dependencies you would like to secure to your AKS VNET"
              selectedKeys={Array.from(net.serviceEndpoints)}
              // eslint-disable-next-line react/jsx-no-bind
              onChange={(ev, { key, selected }) => {
                updateFn("serviceEndpoints", selected ? net.serviceEndpoints.add(key) : set_imm_del(net.serviceEndpoints, key))
              }}
              multiSelect
              options={[
                { key: 'Microsoft.AzureActiveDirectory', text: 'Microsoft.AzureActiveDirectory' },
                { key: 'Microsoft.AzureCosmosDB', text: 'Microsoft.AzureCosmosDB' },
                { key: 'Microsoft.CognativeServices', text: 'Microsoft.CognativeServices' },
                { key: 'Microsoft.ContainerRegistry', text: 'Microsoft.ContainerRegistry' },
                { key: 'Microsoft.EventHub', text: 'Microsoft.EventHub' },
                { key: 'Microsoft.KeyVault', text: 'Microsoft.KeyVault' },
                { key: 'Microsoft.ServiceBus', text: 'Microsoft.ServiceBus' },
                { key: 'Microsoft.Sql', text: 'Microsoft.Sql' },
                { key: 'Microsoft.Storage', text: 'Microsoft.Storage' },
                { key: 'Microsoft.Web', text: 'Microsoft.Web' }
              ]}
            />
            {invalidArray.includes('serviceEndpoints') &&
              <MessageBar messageBarType={MessageBarType.error}>Please select at least 1 dependent service, or de-select "Enable Service Endpoints"</MessageBar>
            }
          </Stack>
        </Stack.Item>
      }


      <Label>Uses a private IP address from your VNet to access your dependent Azure service, such as Azure Storage, Azure Cosmos DB, SQL</Label>
      <Checkbox styles={{ root: { marginTop: '0 !important' } }} disabled={false} checked={net.vnetprivateend} onChange={(ev, v) => updateFn("vnetprivateend", v)} label="Enable Private Link" />


      <Label>Default or Custom VNET</Label>
      <div ref={_calloutTarget1} style={{ marginTop: 0 }}>
        <ChoiceGroup
          selectedKey={net.custom_vnet}
          onClick={() => setCallout1(true)}
          onChange={(ev, { key }) => updateFn("custom_vnet", key)}
          options={[
            {
              key: false,
              iconProps: { iconName: 'CubeShape' },
              text: 'Default Networking'
            },
            {
              key: true,
              iconProps: { iconName: 'CityNext' }, // SplitObject
              text: 'Custom Networking'
            },
            {
              key: 'custom',
              disabled: true,
              iconProps: { iconName: 'WebAppBuilderFragment' }, // SplitObject
              text: 'BYO VNET (TBC)'
            }
          ]}
        />
      </div>

      {callout1 && !net.custom_vnet && (
        <Callout
          className="ms-CalloutExample-callout"
          target={_calloutTarget1}
          directionalHint={DirectionalHint.rightCenter}
          isBeakVisible={true}
          gapSpace={10}
          setInitialFocus={true}
          onDismiss={() => setCallout1(false)}>

          <MessageBar messageBarType={MessageBarType.info}>Default - Fully Managed Networking</MessageBar>
          <div style={{ padding: "10px", maxWidth: "450px" }}>
            <Text >
              Select this option if you <Text style={{ fontWeight: "bold" }} > don't</Text> require any custom IP settings, so you are not peering with other VNETs or On-Premises networks
                This is the simplest AKS deployment to operate, it provides a <Text style={{ fontWeight: "bold" }} > managed</Text> network setup, including:
              </Text>
            <ul>
              <li>New Dedicated VNET with private IP range for your agents nodes</li>
              <li>Container Networking (default: CNI)</li>
              <li>Standard LoadBalancer for kubernetes services with outbound rule for internet access</li>
            </ul>
          </div>
        </Callout>
      )}


      {callout1 && net.custom_vnet && (
        <Callout
          className="ms-CalloutExample-callout"
          target={_calloutTarget1}
          directionalHint={DirectionalHint.rightCenter}
          isBeakVisible={true}
          gapSpace={10}
          setInitialFocus={true}
          onDismiss={() => setCallout1(false)}>

          <MessageBar messageBarType={MessageBarType.warning}>Custom Networking - Advanced Setup</MessageBar>
          <div style={{ padding: "10px", maxWidth: "500px" }}>
            <Text >
              Select this option if you need to connect your AKS network with another networks, either through VNET peering or a Expressroute or VPN Gateway.
              </Text>
          </div>
        </Callout>
      )}

      {net.custom_vnet &&

        <Stack styles={adv_stackstyle}>
          <Label>Custom Network VENT & Kubernetes Network Configration</Label>
          <Stack horizontal tokens={{ childrenGap: 50 }} styles={{ root: { width: 650 } }}>
            <Stack {...columnProps}>

              <Stack.Item align="start">
                <TextField prefix="Cidr" label="VNET Address space" onChange={(ev, val) => updateFn("vnet", val)} value={net.vnet} />
              </Stack.Item>
              <Stack.Item align="center">
                <TextField prefix="Cidr" label="AKS Nodes subnet" onChange={(ev, val) => updateFn("akssub", val)} value={net.akssub} />
              </Stack.Item>
              {/*
              <Stack.Item align="center">
                <TextField prefix="Cidr" label="LoadBalancer Services subnet" onChange={(ev, val) => updateFn("ilbsub", val)} value={net.ilbsub} />
              </Stack.Item>
              */}
              <Stack.Item align="center">
                <TextField prefix="Cidr" disabled={!net.afw} label="Azure Firewall subnet" onChange={(ev, val) => updateFn("afwsub", val)} value={net.afw ? net.afwsub : "No Firewall requested"} />
              </Stack.Item>

              <Stack.Item align="center">
                <TextField prefix="Cidr" disabled={addons.ingress !== 'appgw'} label="Application Gateway subnet" onChange={(ev, val) => updateFn("agsub", val)} value={addons.ingress === 'appgw' ? net.agsub : "N/A"} />
              </Stack.Item>
            </Stack>

            <Stack {...columnProps}>
              <Label>Kubernetes Networking Configuration</Label>
              <Stack.Item align="start">
                <TextField prefix="Cidr" label="POD Network" disabled={net.networkPlugin !== 'kubenet'} onChange={(ev, val) => updateFn("podCidr", val)} value={net.networkPlugin === 'kubenet' ? net.podCidr : "IPs from subnet"} />
              </Stack.Item>
              <Stack.Item align="start">
                <TextField prefix="Cidr" label="Service Network" onChange={(ev, val) => updateFn("service", val)} value={net.service} />
              </Stack.Item>

            </Stack>
          </Stack>
        </Stack>

      }
    </Stack>
  )
}
