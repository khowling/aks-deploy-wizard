
import React, { useState, useEffect } from 'react';
import { Fabric, mergeStyles, FontIcon, FontWeights, Pivot, PivotItem, DefaultButton, TextField, Icon, Link, Separator, DropdownMenuItemType, Dropdown, Slider, DirectionalHint, Callout, Stack, Text, Toggle, Label, ChoiceGroup, Checkbox, MessageBar, MessageBarType } from '@fluentui/react';

import { Card } from '@uifabric/react-cards'
import { appInsights } from '../index.js'

import { initializeIcons } from '@uifabric/icons';
initializeIcons();


const optionRootClass = mergeStyles({
  display: 'flex',
  alignItems: 'baseline'
});

const adv_stackstyle = { root: {  border: "1px solid", background: "#fcfcfc", margin: "10px 0" , padding: "15px", height: "1100px" } }

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
    apiips: '',
    policy: false,
    autoscale: false,
    upgradeChannel:'none',
    count: 2,
    maxCount: 20,
    vmSize: "Standard_DS3_v2",
    osDiskSizeGB: 0,
    osDiskType: "Ephemperal",
    enable_aad: true,
    aad_tenant_id: "",
    enableAzureRBAC: true,
    aadgroupids: ""
  })
  const [addons, setAddons] = useState({
    networkPolicy: 'none',
    ingress: 'none',
    certMan: false,
    certEmail: "",
    dns: false,
    dnsZone: "",
    registry: 'none',
    keyvaultcsi: false,
    podid: false,
    podscale: false,
    reboot: false,
    monitor: "none",
    retentionInDays: 30
  })
  const [net, setNet] = useState({
    networkPlugin: 'azure',
    afw: false,
    vnetserviceend: true,
    vnetprivateend: false,
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
  const [deploy, setDeploy] = useState({
    clusterName: "",
    location: "WestEurope",
    demoapp: false,
    disablePreviews: true
  })

  useEffect(() => {
    console.log ('effect')
    setOperationsManaged()
    setSecurityNormal()

  
    fetch('https://api.ipify.org?format=json').then(response => {
      return response.json();
    }).then((res) => {
      setCluster((prev) => {return {...prev, apiips: res.ip}})
    }).catch((err) => console.error('Problem fetching my IP', err))
 

  },[])
  
  function setSecurityNormal()  { 
    setDefaultSecurity('normal')
    setCluster((prev) => {return {...prev, enable_aad: true,  apisecurity:'whitelist', policy:true }})
    setAddons((prev) => {return {...prev, networkPolicy:'calico', }})
    setNet((prev) => {return {...net, vnetserviceend:true, vnetprivateend: false, afw:false}})
  }
  function setOperationsManaged()  {
    setDefaultCluster('managed')
    setCluster((prev) => {return {...cluster, autoscale: true, upgradeChannel:'stable'}})
    setAddons((prev) => {return {...addons, registry: 'acr', ingress: 'appgw', monitor: 'aci', reboot: true}})
  }
  
  function _handleLinkClick(item) {
    setKey(item.props.itemKey)
  }

  function mergeState(fn, state, key, val) {
    fn({...state, [key]: val })
  }

  

  function invalidFn(page, key, invalid) {
    
    if (!invalid && invalidArray[page].includes(key)) {
      setInvalidArray({...invalidArray, [page]: invalidArray[page].filter((v) => v !== key)})
    } else if (invalid && !invalidArray[page].includes(key)) {
      setInvalidArray({...invalidArray, [page]: invalidArray[page].concat(key)})
    }
  }

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
        <img src="aks.svg" alt="Kubernetes Service" style={{width: "6%", height: "auto"}}></img>
        <Stack tokens={{ padding: 10 }}>
          <Text variant="xLarge">AKS Deploy helper</Text>
          <Text >Tell us the requirements of your AKS deployment, and we will generate the configuration to create a full operational environment, incorporating best-practics guidence </Text>
        </Stack>
      </Stack>

      <Stack verticalFill styles={{ root: { width: '960px', margin: '0 auto', color: 'grey' } }}>

        <Separator styles={{root:{margin: "15px 0"}}}><b>Operations Principles</b></Separator>

        <Stack horizontal tokens={{ childrenGap: 30 }}>

        <Card
            onClick={() => {
              setDefaultCluster('none')
              setCluster({...cluster, autoscale: false, upgradeChannel:'none'})
              setAddons({...addons, registry: 'none', ingress: 'none', reboot: false, monitor: 'none'})
            }}
            tokens={{ childrenMargin: 12}}
          >
            <Card.Item>
              <ChoiceGroup  selectedKey={defaultCluster}  options={[{ key: 'none', text: 'Simplest bare-bones cluster', styles: { root: {fontWeight: defaultCluster === 'none' ? '500' : 'normal'}}}]} />
            </Card.Item>

            <Card.Item>
              <FontIcon iconName="Manufacturing" className={iconClass} />
            </Card.Item>

            <Card.Item styles={{root: { marginTop: '0px !important'}}}>
            <div style={{fontSize: "12px"}} >Just kubernetes please, I will make desisions later
              </div>
            </Card.Item>
          </Card>

          <Card
            onClick={() => {
              setDefaultCluster('oss')
              setCluster({...cluster, autoscale: false, upgradeChannel:'none'})
              setAddons({...addons, registry: 'none', ingress: 'nginx', reboot: false, monitor: 'oss'})
            }}
            tokens={{ childrenMargin: 12}}
          >
            <Card.Item>
              <ChoiceGroup  selectedKey={defaultCluster} options={[{ key: 'oss', text: 'I prefer control & commuity opensource soltuions', styles: { root: {fontWeight: defaultCluster === 'oss' ? '500' : 'normal'}} }]} />
            </Card.Item>

            <Card.Item>
              <FontIcon iconName="DeveloperTools" className={iconClass} />
            </Card.Item>

            <Card.Item styles={{root: { marginTop: '0px !important'}}}>
              <div style={{fontSize: "12px"}} >Use proven, opensource projects for my Kubernetes operational environment, and self-manage my clusters upgrades and scalling
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
            tokens={{ childrenMargin: 12}}
          >
            <Card.Item>
              <ChoiceGroup selectedKey={defaultCluster} options={[{ key: 'managed', text: 'I want a managed environment (Recommended for most)', styles: { root: {fontWeight: defaultCluster === 'managed' ? '500' : 'normal'}} }]} />
            </Card.Item>

            <Card.Item>
              <FontIcon iconName="Touch" className={iconClass} />
            </Card.Item>

            <Card.Item styles={{root: { marginTop: '0px !important'}}}>
              <div style={{fontSize: "12px"}} >
                I'd like my cluster to be auto-managed by Azure for upgrades and scalling, and use Azure provided managed addons to create an full environment with the minimum of operational requirements
              <ul>
                <li>Cluster auto-scaller (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/aks/cluster-autoscaler">docs</a>)</li>
                <li>Cluser auto-upgrades** (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/aks/upgrade-cluster#set-auto-upgrade-channel">docs</a>)</li>
                <li>Azure Monitor for Containers (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/azure-monitor/insights/container-insights-overview">docs</a>)</li>
                <li>Azure Container Registry</li>
                <li>Azure AppGateway Ingress** (<a target="_nsg" href="https://docs.microsoft.com/en-gb/azure/application-gateway/ingress-controller-overview">docs</a>)</li>
                <li>Auto-reboots (weaveworks kured) (<a target="_nsg" href="https://github.com/weaveworks/kured">docs</a>)</li>
              </ul>
              </div>
            </Card.Item>
          </Card>
        </Stack>


        <Separator styles={{root:{marginTop: "15px !important", marginBottom: "15px"}}}><b>Security Principles</b></Separator>

        <Stack horizontal tokens={{ childrenGap: 30 }}>

        <Card
            onClick={() => {
              setDefaultSecurity('low')
              setCluster({...cluster, enable_aad: false,  apisecurity: 'none', policy:false})
              setAddons((prev) => {return {...prev, networkPolicy:'none', }})
              setNet({...net, vnetserviceend:false, vnetprivateend: true, afw:false})
            }}
            tokens={{ childrenMargin: 12}}
          >
            <Card.Item>
              <ChoiceGroup  selectedKey={defaultSecurity} options={[{ key: 'low', text: 'Simple cluster with no additional access limitations', styles: { root: {fontWeight: defaultSecurity === 'low' ? '500' : 'normal'}}}]} />
            </Card.Item>
            <Card.Item>
              <FontIcon iconName="Unlock" className={iconClass} />
            </Card.Item>
            <Card.Section>
              <div style={{fontSize: "12px"}} >Simplest option for experimenting with kubernetes, or clusters with no sensitive data
              </div>
            </Card.Section>
          </Card>

          <Card
            onClick={setSecurityNormal}
            tokens={{ childrenMargin: 12}}
          >
            <Card.Item>
              <ChoiceGroup  selectedKey={defaultSecurity} options={[{ key: 'normal', text: 'Custer with additional security controls (Recommended for most)', styles: { root: {fontWeight: defaultSecurity === 'normal' ? '500' : 'normal'}} }]} />
            </Card.Item>
            <Card.Item>
              <FontIcon iconName="Lock12" className={iconClass} />
            </Card.Item>
            <Card.Item>
              <div style={{fontSize: "12px"}} >Best option for implmenting recommended security controls for regular production environments
              <ul>
                <li>AAD Integration (<a target="_nsg" href="https://docs.microsoft.com/en-gb/azure/aks/managed-aad">docs</a>)</li>
                <li>Authorized IP address ranges (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/aks/api-server-authorized-ip-ranges">docs</a>)</li>
                <li>Restrict privileged workloads (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/governance/policy/concepts/policy-for-kubernetes">docs</a>)</li>
                <li>East-West traffic control (<a target="_nsg" href="https://docs.microsoft.com/en-gb/azure/aks/use-network-policies">docs</a>)</li>
              {/* <li>Service Endpoint dependencies (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/virtual-network/virtual-network-service-endpoints-overview">docs</a>)</li>
                */}
                </ul>
              </div>
            </Card.Item>
          </Card>

          <Card
            onClick={() => {
              setDefaultSecurity('high')
              setCluster({...cluster,  enable_aad: true, apisecurity: 'private', policy:true})
              setAddons((prev) => {return {...prev, networkPolicy:'calico'}})
              setNet({...net, vnetserviceend:false, vnetprivateend: true, afw:true})
            }}
            tokens={{ childrenMargin: 12}}
          >
            <Card.Item>
              <ChoiceGroup selectedKey={defaultSecurity} options={[{ key: 'high', text: 'Cluster with isolating networking controls', styles: { root: {fontWeight: defaultSecurity === 'high' ? '500' : 'normal'}} }]} />
            </Card.Item>

            <Card.Item>
              <FontIcon iconName="ProtectionCenterLogo32" className={iconClass} />
            </Card.Item>
            <Card.Item>
              <div style={{fontSize: "12px"}} >
                Best option for high-secure application requirements, regulated environments or sensitive data requirements.  WARNING: most complex environment option to operate
                  
                <ul>
                  <li>Private cluster (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/aks/private-clusters">docs</a>)</li>
                  <li>Restrict egress with Azure firewall (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/aks/limit-egress-traffic#restrict-egress-traffic-using-azure-firewall">docs</a>)</li>
                  <li>Private Link dependencies (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/private-link/private-link-overview">docs</a>)</li>
                  <li>Confidential computing nodes (<a target="_nsg" href="https://docs.microsoft.com/en-us/azure/confidential-computing/confidential-nodes-aks-overview">docs</a>)</li>
                </ul>
              </div>
            </Card.Item>
          </Card>
        </Stack>
        
        <Separator styles={{root:{marginTop: "15px !important", marginBottom: "5px"}}}><b>Deploy</b> (optionally use 'Details' tabs for additional configuration)</Separator>
        
        <Pivot selectedKey={key} onLinkClick={_handleLinkClick}>
          <PivotItem headerText={navScreenHeader[3]} itemKey="0" onRenderItemLink={(a,b) => _customRenderer('deploy', a,b)}>
          <DeployScreen net={net} addons={addons} cluster={cluster} deploy={deploy} updateFn={(key, val) => mergeState(setDeploy, deploy, key, val)} invalidFn={(key, val) => invalidFn("deploy", key, val)} invalidArray={invalidArray} />

          </PivotItem>
          <PivotItem headerText={navScreenHeader[0]} itemKey="1" onRenderItemLink={(a,b) => _customRenderer('cluster', a,b)} >
            <ClusterScreen cluster={cluster} updateFn={(key, val) => mergeState(setCluster, cluster, key, val)} invalidFn={(key, val) => invalidFn("cluster", key, val)} />
          </PivotItem>
          <PivotItem headerText={navScreenHeader[1]} itemKey="2" onRenderItemLink={(a,b) => _customRenderer('addons', a,b)} >
            <AddonsScreen cluster={cluster} addons={addons} updateFn={(key, val) => mergeState(setAddons, addons, key, val)} invalidFn={(key, val) => invalidFn("addons", key, val)} />
          </PivotItem>
          <PivotItem headerText={navScreenHeader[2]} itemKey="3"  onRenderItemLink={(a,b) => _customRenderer('net', a,b)}>
            <NetworkScreen net={net} addons={addons} cluster={cluster} updateFn={(key, val) => mergeState(setNet, net, key, val)} invalidFn={(key, val) => invalidFn("net", key, val)} />
          </PivotItem>
         
        </Pivot>

      </Stack>
    </main>
  </Fabric>

  )
}

function DeployScreen({ updateFn, net, addons, cluster, deploy, invalidFn, invalidArray }) {


  let deploy_version = "v1.6"
  var queryString = window && window.location.search
  if (queryString) {
    var match = queryString.match('[?&]v=([^&]+)')
    if (match) {
      deploy_version = match[1]
    }
  }



  let armcmd = `az group create -l ${deploy.location} -n ${deploy.clusterName}-rg
az deployment group create -g ${deploy.clusterName}-rg  ${process.env.REACT_APP_AZ_TEMPLATE_ARG} --parameters` +
    ` kubernetesVersion=${process.env.REACT_APP_K8S_VERSION}` +
    ` resourceName=${deploy.clusterName}` +
    (cluster.vmSize !== 'default' ? ` agentVMSize=${cluster.vmSize}` : '') +
    ` agentCount=${cluster.count}` +
    (cluster.autoscale ? ` agentCountMax=${cluster.maxCount}` : '') +
    (cluster.osDiskType === 'Managed' ? ` osDiskType=${cluster.osDiskType} ${(cluster.osDiskSizeGB > 0 ? ` osDiskSizeGB={$cluster.osDiskSizeGB}` : '')}` : '') +
    (net.custom_vnet ? ' custom_vnet=true' : '') + 
    (cluster.enable_aad ? ` enable_aad=true ${(cluster.enableAzureRBAC === false && cluster.aad_tenant_id  ? `aad_tenant_id={$cluster.aad_tenant_id} ` : '')}` : '') +
    (addons.registry === 'acr' ? `registries_sku=Basic` : '') +
    (net.afw ?  ` azureFirewalls=true`  : '') +
    (addons.monitor === 'aci' ? ` omsagent=true retentionInDays=${addons.retentionInDays}` : "") + 
    (addons.networkPolicy !== 'none' ?  ` networkPolicy=${addons.networkPolicy}` : '') + 
    (net.networkPlugin !== 'azure' ? ` networkPlugin=${net.networkPlugin}` : '') + 
    (cluster.apisecurity === 'whitelist' ? ` authorizedIPRanges=${cluster.apiips}` : '') +
    (cluster.apisecurity === 'private' ? ` enablePrivateCluster=true` : '')



  let features = 
    (addons.podscale ? " -a podscale " : "") + 
    (addons.podid ? "-a podid " : "") + 
    (addons.keyvaultcsi ? "-a keyvaultcsi " : "") + 
    (addons.reboot ? ' -a kured ':'') + 
    (cluster.autoscale ? ` -a clustrautoscaler=${cluster.maxCount} `:'') + 
    (cluster.apisecurity !== 'none' ? ` apisecurity=${cluster.apisecurity} `:'') 

  let preview_features = 
    (cluster.enable_aad && cluster.enableAzureRBAC ? ' enableAzureRBAC=true':'') +
    (cluster.upgradeChannel !== 'none' ?  ` upgradeChannel=${cluster.upgradeChannel}` : '') +
    (addons.ingress === 'appgw' ? ` ingressApplicationGateway=true` : '') 
    
    //? 'az feature register --name AKS-IngressApplicationGatewayAddon --namespace Microsoft.ContainerService' : '') +
    //(` -a ${addons.ingress} ` + (addons.dns && cluster.securityLevel === "normal" ? ` -a dns=${addons.dnsZone.split("/")[4] + "/" + addons.dnsZone.split("/")[8]}` : "") + (addons.certMan && cluster.securityLevel === "normal" ? ` -a cert=${addons.certEmail}` : "")) : "") + 
    //(cluster.securityLevel === "high" ? " -a private-api -a podsec " : "")


  //let deploy_str = `wget -qO - https://github.com/khowling/aks-deploy-arm/tarball/${deploy_version} | \\
  //  tar xzf - && ( cd khowling-aks-deploy-arm-*; chmod +x ./deploy.sh; \\
  //  ./deploy.sh -l ${deploy.location} ${cluster.networkPlugin ? " -n networkPlugin " : ""} -c ${cluster.count} ${cluster.vmSize !== 'default' ? "-v " + cluster.vmSize : ""} ${cluster.osDiskSizeGB > 0 ? "-o " + cluster.osDiskSizeGB : ""} ${deploy.demoapp ? "-d" : ""} ${aad_cmd}  \\
  //  ${features} ${deploy.disablePreviews ? "" : preview_features} \\
  //  ${deploy.clusterName} )`

  let invalidname = deploy.clusterName.length < 5
  invalidFn('clusterName', invalidname)
  return (
    
    <Stack tokens={{ childrenGap: 15 }} styles={adv_stackstyle}>
      <Stack horizontal  styles={{root: {width: "100%"}}} tokens={{ childrenGap: 150 }}>
        <Stack styles={{root: {width: "300px"}}}>
          
          <TextField label="Cluster Name" onChange={(ev, val) => updateFn('clusterName', val)} required errorMessage={invalidname ? "Enter valid cluster name" : ""} value={deploy.clusterName} />
          <Dropdown
            label="Location"
            selectedKey={deploy.location}
            onChange={(ev, { key }) =>updateFn('location', key)}
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
        <Stack styles={{root: {width: "300px"}}}>
        <TextField label="Kubernetes version" disabled={true} value={process.env.REACT_APP_K8S_VERSION}/>
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

      <Separator ><b>Deploy Cluster</b></Separator>

      { preview_features.length >0  &&
        <MessageBar messageBarType={MessageBarType.warning}>
          <Text >Your deployment contains Preview features: <b>{preview_features}</b>, Ensure you have registered for ALL these previews before running the script, <Link target="_pv" href="https://github.com/Azure/AKS/blob/master/previews.md">see here</Link>, or disable preview features here</Text>
        <Toggle styles={{root: {marginTop: "10px"}}} onText='preview disabled' offText="preview enabled" checked={deploy.disablePreviews} onChange={(ev, checked) => updateFn("disablePreviews", checked)} />
        </MessageBar>

      }
      { (addons.monitor === 'oss' || addons.ingress === 'nginx')  &&
        <MessageBar messageBarType={MessageBarType.warning}>
          <Text >Your deployment contains Opensource community solutions, these solutions are not managed by Microsoft, you will be responsible for managing the lifecycle of these solutions</Text>
        </MessageBar>

      }
      <TextField label="Command" styles={{root: {fontFamily: 'SFMono-Regular,Consolas,Liberation Mono,Menlo,Courier,monospace!important', lineHeight: '19px'}}} multiline rows={5} readOnly value={`${armcmd}${deploy.disablePreviews ? '' : preview_features}`} errorMessage={invalidname || invalidArray.length > 0 ? "Please fix errors before running script" : ""} />
      <Text styles={{root: {marginTop: "2px !important"}}} variant="medium" >Open a Linux shell (requires 'az cli' pre-installed), or, open the <Link target="_cs" href="http://shell.azure.com/">Azure Cloud Shell</Link>. <Text variant="medium" style={{ fontWeight: "bold" }}>Paste the commands</Text> into the shell</Text>


    </Stack>
  )
}

const VMs = [
    { key: 'gp', text: 'General purpose V2', itemType: DropdownMenuItemType.Header },
    { key: 'default',          text: '(Standard_DS2_v2) 2 vCPU,  7 GiB RAM, 14GiB SSD,  86 GiB cache (8000 IOPS)', eph: false },
    { key: 'Standard_DS3_v2',  text: '(Standard_DS3_v2) 4 vCPU, 14 GiB RAM, 28GiB SSD, 172 GiB cache (16000 IOPS)', eph: true  },
    { key: 'gp', text: 'General purpose V4', itemType: DropdownMenuItemType.Header },
    { key: 'Standard_D2ds_v4', text: '2 vCPU,  8 GiB RAM, 75GiB  SSD (19000 IOPS)', eph: false },
    { key: 'Standard_D4ds_v4', text: '4 vCPU, 16 GiB RAM, 150GiB SSD, 100 GiB cache  (38500 IOPS)', eph: false },
    {key: 'Standard_D8ds_v4',  text: '8 vCPU, 32 GiB RAM, 300GiB SSD (77000 IOPS)', eph: true },
    { key: 'comp', text: 'Compute optimized', itemType: DropdownMenuItemType.Header },
    { key: 'Standard_F2s_v2', text: '2 vCPU, 4 GiB RAM, 16 GiB SSD (3200 IOPS)', eph: false }
]

function ClusterScreen({ cluster, updateFn, invalidFn }) {

  const [useAltAad, setUseAltAad] = useState(false)


  const valid_osDiskType = cluster.osDiskType === 'Ephemperal' && !VMs.find(i => i.key === cluster.vmSize).eph
  invalidFn('osDiskType', valid_osDiskType)

  return (
    <Stack tokens={{ childrenGap: 15 }} styles={adv_stackstyle}>

      <Label style={{ marginBottom: "10px" }}>Cluster Performance & Scale Requirements (system nodepool)</Label>
      <Stack vertical tokens={{ childrenGap: 15 }} style={{ marginTop: 0 }} >

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
              <Slider label={`Initial ${cluster.autoscale ? "(& Autoscaler Min nodes)": "nodes"}`} min={1} max={10} step={1} defaultValue={cluster.count} showValue={true}
                onChange={(v) => updateFn("count", v)} />
              {cluster.autoscale && (
                <Slider label="Autoscaler Max nodes" min={5} max={100} step={5} defaultValue={cluster.maxCount} showValue={true}
                  onChange={(v) => updateFn("maxCount", v)}
                  snapToStep />
              )}
            </Stack>
          </Stack.Item>
        </Stack>
        
        <Stack  horizontal tokens={{ childrenGap: 55 }}>
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

                { valid_osDiskType && <MessageBar messageBarType={MessageBarType.error}>Youre selected VM cache is not large enough to support Ephemeral. Select 'Managed' or a VM with a larger cache</MessageBar>}
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

              { cluster.osDiskType === 'Managed' &&
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

      <Stack.Item align="start">
        <Label required={true}>
            Cluster Auto-upgrade
        </Label>
        <ChoiceGroup
          selectedKey={cluster.upgradeChannel}
          options={[
            { key: 'none', text: 'Disables auto-upgrades' },
            { key: 'patch', text: 'Automatically upgrade the cluster to the latest supported patch version when it becomes available while keeping the minor version the same.' },
            { key: 'stable', text: 'Automatically upgrade the cluster to the latest supported patch release on minor version N-1, where N is the latest supported minor version' },
            { key: 'rapid', text: 'Automatically upgrade the cluster to the latest supported patch release on the latest supported minor version.' }

          ]}
          onChange={(ev, opt) => updateFn("upgradeChannel", opt.key)}
        />
      </Stack.Item>
      
      <Stack horizontal tokens={{ childrenGap: 142 }} styles={{root:{ marginTop: 10 }}}>
        <Stack.Item>
          <ChoiceGroup label={<Label>Cluster User Authentication <Link target="_" href="https://docs.microsoft.com/en-gb/azure/aks/managed-aad">docs</Link></Label>}
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
          {cluster.enable_aad ? (

            <Stack tokens={{ childrenGap: 10 }} styles={{ root: { width: 450, marginTop: "30px" } }}>

              <ChoiceGroup
                styles={{ root: { width: 300 } }}
                selectedKey={useAltAad}
                options={[
                  {
                    key: false,
                    text: 'Use the AKS subscription tenant',
                  },
                  {
                    key: true,
                    text: 'Use alt. tenant',
                    onRenderField: (props, render) => {

                      let invalid = cluster.enable_aad && props.checked && cluster.aad_tenant_id.length !== 36
                      invalidFn("aad_tenant_id", invalid)
                      return (
                        <div className={optionRootClass}>
                          {render(props)}
                          <TextField
                            value={cluster.aad_tenant_id}
                            onChange={(ev, val) => updateFn("aad_tenant_id", val)}
                            errorMessage={invalid ? "Enter Valid Directory ID" : ""}
                            styles={{ root: { marginLeft: 5 } }}
                            disabled={props ? !props.checked : false}
                            required placeholder="tenant id" />


                        </div>
                      );
                    }
                  }
                ]}
                onChange={(ev, val) => setUseAltAad(val.key)}
                
              />
          
          <Checkbox checked={cluster.enableAzureRBAC} onChange={(ev, val) => updateFn("enableAzureRBAC", val)} onRenderLabel={() => <Text styles={{root:{color: 'black'}}}>Azure RBAC for Kubernetes Authorization <Link target='_' href='https://docs.microsoft.com/en-us/azure/aks/manage-azure-rbac'>docs</Link>**</Text>} />

          { !cluster.enableAzureRBAC && 
            <>
            <TextField label="AAD Group objectIDs that will have admin role of the cluster ',' seperated" onChange={(ev, val) => updateFn("aadgroupids", val)} value={cluster.aadgroupids}/>
            { cluster.enable_aad && !cluster.aadgroupids &&
              <MessageBar messageBarType={MessageBarType.warning}>You will be forbidden to do any kubernetes options unless you add a AAD Groups here, or follow <Link target='_' href='https://docs.microsoft.com/en-us/azure/aks/azure-ad-rbac#create-the-aks-cluster-resources-for-app-devs'>this</Link> after the cluster is created</MessageBar>
            }
            </>
          }

            </Stack>
          ) : invalidFn("aad_tenant_id", false)}
        </Stack.Item>
      </Stack>

      <Stack.Item align="start">
        <Label required={true}>
            Cluster API Server Secuity
        </Label>
        <ChoiceGroup
          selectedKey={cluster.apisecurity}
          options={[
            { key: 'none', text: 'Public IP with no IP restrictions' },
            { key: 'whitelist', text: 'Create allowed IP ranges (defaults to IP address of machine running the script)' },
            { key: 'private', text: 'Private Cluster (WARNING: requires jummpbox to access)' }

          ]}
          onChange={(ev, opt) => updateFn("apisecurity", opt.key)}
        />
      </Stack.Item>

      <Stack.Item align="center" styles={{ root: { display: (cluster.apisecurity !== "whitelist" ? "none" : "block") } }} >
      <TextField label="IP Addresses that can access your cluster API Server (',' seperated)" onChange={(ev, val) => updateFn("apiips", val)} value={cluster.apiips}/>
      </Stack.Item>
      
    </Stack>

  )
}


const columnProps = {
  tokens: { childrenGap: 15 },
  styles: { root: { width: 300 } }
}

function AddonsScreen({ cluster, addons, updateFn, invalidFn }) {

  const [callout, setCallout] = useState(false)
  let _calloutTarget = React.createRef()

  return (
    <Stack tokens={{ childrenGap: 15 }} styles={adv_stackstyle}>

      <Stack.Item align="start">
        <Label >Cluster Monitoring requirements</Label>
        <ChoiceGroup
          selectedKey={addons.monitor}
          options={[
            { key: 'none', text: 'None' },
            { key: 'aci', text: 'Azure Monitor for Containers (logs and metrics)' },
            { key: 'oss', text: 'Promethous / Grahana Helm Chart (metrics only)' }

          ]}
          onChange={(ev, opt) => updateFn("monitor", opt.key)}
        />
      </Stack.Item>
      <Stack.Item align="center" styles={{ root: { display: (addons.monitor !== "aci" ? "none" : "block") } }} >

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

      <Stack.Item align="start">
        <Label >Cluster East-West traffic restrictions</Label>
        <ChoiceGroup
          selectedKey={addons.networkPolicy}
          options={[
            { key: 'none', text: 'No restrictions, all PODs can access each other' },
            { key: 'calico', text: 'Install Calico to implemented intra-cluster traffic restrictions' },
            { key: 'azure', text: 'Install the Azure Network Policy to implemented intra-cluster traffic restrictions' }

          ]}
          onChange={(ev, opt) => updateFn("monitor", opt.key)}
        />
      </Stack.Item>

      <Label >OSS Addon for rebooting nodes if kernal update has been detected</Label>
      <Checkbox checked={addons.reboot} onChange={(ev, val) => updateFn("reboot", val)} label="Automatically reboot nodes after scheduled OS updates (kured)" />

      <Stack.Item align="start">
        <Label required={true}>
          Securely Expose your applications to the Internet via HTTPS
        </Label>
        <ChoiceGroup
          selectedKey={addons.ingress}
          options={[
            { key: 'none', text: 'No, applications will not be exposed, or, I will configure my own solution' },
            { key: 'nginx', text: 'Yes, deploy nginx in the cluster to expose my apps to the internet (nginx ingress controller)' },
            { key: 'appgw', text: 'Yes, deply an Azure Managed Gateway with WAF protection (Application Gateway)' }
          ]}
          onChange={(ev, opt) => updateFn("ingress", opt.key)}
        />
      </Stack.Item>

      { addons.ingress === "nginx" && cluster.securityLevel !== "normal" &&
        <MessageBar messageBarType={MessageBarType.warning}>You requested a high security cluster & nginx public ingress. Please ensure you follow this information after deployment <Link target="_ar1" href="https://docs.microsoft.com/en-us/azure/firewall/integrate-lb#public-load-balancer">Asymmetric routing</Link></MessageBar>
      }
      { addons.ingress !== "none" && cluster.securityLevel !== "normal" &&
        <MessageBar messageBarType={MessageBarType.warning}>You requested a high security cluster. The DNS and Certificate options are disabled as they require additional egress application firewall rules for image download and webhook requirements. You can apply these rules and install the helm chart after provisioning</MessageBar>
      }

      <Stack.Item align="center" styles={{ root: { display: (addons.ingress === "none" ? "none" : "block") } }} >
        <Stack tokens={{ childrenGap: 15 }}>

          <Checkbox disabled={cluster.securityLevel !== "normal"} checked={addons.dns} onChange={(ev, v) => updateFn("dns", v)} label={<Text>Create FQDN URLs for your applications (requires <Text style={{ fontWeight: "bold" }}>Azure DNS Zone</Text> - <Link href="https://docs.microsoft.com/en-us/azure/dns/dns-getstarted-portal#create-a-dns-zone" target="_t1">how to create</Link>)</Text>} />
          {((show) => {
            //  styles={{ root: {display: (addons.dns ? "block" :  "none" )}}}
            if (show) {
              let invalid = true
              if (addons.dnsZone && addons.dnsZone.length > 100) {
                let resid_array = addons.dnsZone.split("/")
                if (!(resid_array.length !== 9 || resid_array[1] !== "subscriptions" || resid_array[3] !== "resourceGroups" || resid_array[7] !== "dnszones" || resid_array[8].indexOf(".") <= 0)) {
                  invalid = false
                }
              }
              invalidFn("certMan", invalid)
              return (
                <TextField disabled={cluster.securityLevel !== "normal"} value={addons.dnsZone} onChange={(ev, v) => updateFn("dnsZone", v)} errorMessage={invalid ? "Enter valid resourceId" : ""} underlined required placeholder="Resource Id" label={<Text style={{ fontWeight: 600 }}>Enter your Azure DNS Zone ResourceId <Link target="_t2" href="https://ms.portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.Network%2FdnsZones">find it here</Link></Text>} />
              )
            } else {
              invalidFn("certMan", false)
            }
          })(addons.dns && addons.ingress !== 'none')}

          <Checkbox disabled={cluster.securityLevel === "high"} checked={addons.certMan} onChange={(ev, v) => updateFn("certMan", v)} label="Automatically Issue Certificates for HTTPS (cert-manager with Lets Encrypt - requires email" />
          {((show) => {
            //  styles={{ root: {display: (addons.dns ? "block" :  "none" )}}}
            if (show) {
              let invalid = true
              if (addons.certEmail && addons.certEmail.length > 4) {
                let e_array = addons.certEmail.split("@")
                if (!(e_array.length !== 2 || e_array[1] === "example.com" || e_array[1].indexOf(".") <= 0)) {
                  invalid = false
                }
              }
              invalidFn("certEmail", invalid)
              return (
                <TextField disabled={cluster.securityLevel !== "normal"} value={addons.certEmail} onChange={(ev, v) => updateFn("certEmail", v)} errorMessage={invalid ? "Enter valid resourceId" : ""} label="Enter mail address for certificate notification:" underlined required placeholder="email@address.com" />
              )
            } else {
              invalidFn("certEmail", false)
            }
          })(addons.certMan && addons.ingress !== 'none')}


        </Stack>
      </Stack.Item>

      <Separator className="notopmargin" />

      <Stack.Item align="start">
        <Label required={true}>
          Do you require a secure private container registry to store my application images
        </Label>
        <ChoiceGroup
          selectedKey={addons.registry}
          options={[
            { key: 'none', text: 'No, my application images will be on dockerhub or another registry' },
            { key: 'acr', text: 'Yes, setup Azure Container Registry & secure access to the cluster ($)' }
          ]}
          onChange={(ev, { k }) => updateFn("registry", k)}
        />
      </Stack.Item>

      <Separator className="notopmargin" />

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



function NetworkScreen({ net, updateFn, invalidFn, addons, cluster }) {

  const [callout1, setCallout1] = useState(false)
  const [callout2, setCallout2] = useState(false)
  var _calloutTarget1 = React.createRef()
  var _calloutTarget2 = React.createRef()

  return (
    <Stack tokens={{ childrenGap: 15 }} styles={adv_stackstyle}>

      <Label>Network Plugin</Label>

      <Toggle
        label="Do you need to limit your non-routable IP usage on your network (use network calculator)"
        checked={net.networkPlugin === 'kubenet'}
        onText="Yes - Use 'networkPlugin' so your PODs do not receive VNET IPs"
        offText="No - Use 'CNI' for fastest container networking"
        onChange={(ev, val) => updateFn("networkPlugin", val? 'kubenet' : 'azure')}
      // styles={{ label: {fontWeight: "regular"}}}
      />

      <Label>Setup Azure firewll for your cluster egress</Label>
      <Checkbox disabled={false} checked={net.afw} onChange={(ev, v) => updateFn("afw", v)} label="Implement Azure Firewall & UDR nexthop" />


      <Label>Select Default or Custom Networking Connectivity</Label>
      <div ref={_calloutTarget1} style={{ marginTop: 0, maxWidth: "220px" }}>
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
            }
          ]}
        />
      </div>

      { callout1 && !net.custom_vnet && (
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
              Select this option if you <Text style={{ fontWeight: "bold" }} > don't</Text> require any "network layer" vnet with other VNET or On-Premises networks
                This is the simplest AKS deployment to operate, it provides a <Text style={{ fontWeight: "bold" }} >full managed</Text> network setup
              </Text>
            <ul>
              <li>Dedicated VNET with private IP range for your agents</li>
              <li>Container Networking. Performant PODs networking (CNI)</li>
              <li>Standard LoadBalancer for services (internal or external)</li>
            </ul>
          </div>
        </Callout>
      )}


      { callout1 && net.custom_vnet && (
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
              Select this option if you need to connect your AKS network with another networks, either through VNET peering or a Expressroute or VPN Gateway.  You will need to complete the <Text style={{ fontWeight: "bold" }} >"Advanced Connectivity"</Text> tab in this wizard
              </Text>
          </div>
        </Callout>
      )}

      { net.custom_vnet &&
      
      <Stack styles={adv_stackstyle}>
      <Label>Custom Network configration</Label>
      <Stack horizontal tokens={{ childrenGap: 50 }} styles={{ root: { width: 650 } }}>
        <Stack {...columnProps}>
          <Label>AKS Virtual Network & Subnet CIDRs</Label>
          <Stack.Item align="start">
            <TextField prefix="Cidr" onChange={(ev, val) => updateFn("vnet", val)} value={net.vnet} />
          </Stack.Item>
          <Stack.Item align="center">
            <TextField prefix="Cidr" label="AKS Nodes" onChange={(ev, val) => updateFn("akssub", val)} value={net.akssub} />
          </Stack.Item>
          <Stack.Item align="center">
            <TextField prefix="Cidr" label="LoadBalancer Services" onChange={(ev, val) => updateFn("ilbsub", val)} value={net.ilbsub} />
          </Stack.Item>
          <Stack.Item align="center">
            <TextField prefix="Cidr" disabled={!net.afw} label="Azure Firewall" onChange={(ev, val) => updateFn("afwsub", val)} value={cluster.securityLevel !== 'normal' ? net.afwsub : "N/A"} />
          </Stack.Item>

          <Stack.Item align="center">
            <TextField prefix="Cidr" disabled={addons.ingress !== 'appgw'} label="Application Gateway" onChange={(ev, val) => updateFn("agsub", val)} value={addons.ingress === 'appgw' ? net.agsub : "N/A"} />
          </Stack.Item>
        </Stack>

        <Stack {...columnProps}>
          <Label>Kubernetes Networking CIDRs</Label>
          <Stack.Item align="start">
            <TextField prefix="Cidr" label="POD Network" disabled={net.networkPlugin !== 'kubenet'} onChange={(ev, val) => updateFn("podCidr", val)} value={net.networkPlugin ? net.podCidr : "N/A"} />
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
