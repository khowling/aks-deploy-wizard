
import React, { useState, useEffect } from 'react';
import { Fabric, mergeStyles, FontIcon, Pivot, PivotItem, Icon, Separator, Stack, Text, ChoiceGroup } from '@fluentui/react';

import NetworkTab from './networkTab'
import AddonsTab from './addonsTab'
import ClusterTab, { VMs } from './clusterTab'
import DeployTab from './deployTab'

import { set_imm_del, set_imm_add } from './common'

import { Card } from '@uifabric/react-cards'
import { appInsights } from '../index.js'

import { initializeIcons } from '@uifabric/icons';
initializeIcons();




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
    vnet_opt: 'default',
    byoAKSSubnetId: '',
    byoAGWSubnetId: '',
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
    console.log('mereState')
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
  invalidFn('net', 'byoAKSSubnetId', net.vnet_opt === 'byo' && !net.byoAKSSubnetId.match('^/subscriptions/[^/ ]+/resourceGroups/[^/ ]+/providers/Microsoft.Network/virtualNetworks/[^/ ]+/subnets/[^/ ]+$'))
  invalidFn('net', 'byoAGWSubnetId', net.vnet_opt === 'byo' && addons.ingress === 'appgw' && !net.byoAGWSubnetId.match('^/subscriptions/[^/ ]+/resourceGroups/[^/ ]+/providers/Microsoft.Network/virtualNetworks/[^/ ]+/subnets/[^/ ]+$'))


  function _customRenderer(page, link, defaultRenderer) {
    return (
      <span>
        {invalidArray[page].length > 0 &&
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
              <DeployTab net={net} addons={addons} cluster={cluster} deploy={deploy} updateFn={(key, val) => mergeState(setDeploy, deploy, key, val)} invalidArray={invalidArray['deploy']} allok={Object.values(invalidArray).reduce((a, i) => a + i.length, 0) === 0} />

            </PivotItem>
            <PivotItem headerText={navScreenHeader[0]} itemKey="1" onRenderItemLink={(a, b) => _customRenderer('cluster', a, b)} >
              <ClusterTab cluster={cluster} updateFn={(key, val) => mergeState(setCluster, cluster, key, val)} invalidArray={invalidArray['cluster']} />
            </PivotItem>
            <PivotItem headerText={navScreenHeader[1]} itemKey="2" onRenderItemLink={(a, b) => _customRenderer('addons', a, b)} >
              <AddonsTab cluster={cluster} addons={addons} net={net} updateFn={(key, val) => mergeState(setAddons, addons, key, val)} invalidArray={invalidArray['addons']} />
            </PivotItem>
            <PivotItem headerText={navScreenHeader[2]} itemKey="3" onRenderItemLink={(a, b) => _customRenderer('net', a, b)}>
              <NetworkTab net={net} addons={addons} cluster={cluster} updateFn={(key, val) => mergeState(setNet, net, key, val)} invalidArray={invalidArray['net']} />
            </PivotItem>

          </Pivot>

        </Stack>
      </main>
    </Fabric>

  )
}



