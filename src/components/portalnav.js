
import React, { useState } from 'react';

import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot'
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';

import { Link, Separator, DropdownMenuItemType, Dropdown, Slider, DirectionalHint, Callout, Stack, Text, Toggle, Label, ChoiceGroup, Checkbox, MessageBar, MessageBarType } from 'office-ui-fabric-react';
import { TextField, MaskedTextField } from 'office-ui-fabric-react/lib/TextField';

import { mergeStyles } from 'office-ui-fabric-react/lib/Styling';

const optionRootClass = mergeStyles({
  display: 'flex',
  alignItems: 'baseline'
});

export default function PortalNav () {
    const [key, setKey] = useState("0")
    const [invalidArray, setInvalidArray] = useState([])
    const [cluster, setCluster] = useState({
        securityLevel: "normal",
        autoscale: false,
        nodeinit: 3,
        nodemax: 20,
        vmsku: "default",
        osdisk: 0,
        useAad: false,
        useAltAad: false,
        aadid: "",
        monitor: "none",
        reboot: false
    })
    const [app, setApp] = useState({
      connectivity: false,
      ingress: 'none',
      certMan: false,
      certEmail: "",
      dns: false,
      dnsZone: "",
      registry: 'none',
      flexvol: false,
      podid: false,
      podscale: false
    })
    const [net, setNet] = useState({
      topology: 'none',
      kubenet: false,
      vnet: "10.0.0.0/8",
      akssub: "10.240.0.0/16",
      ilbsub: "10.241.0.0/24",
      afwsub: "10.241.0.0/24",
      ersub: "10.242.0.0/24",
      agsub: "10.241.0.0/24",
      pod: "10.244.0.0/16",
      service:"10.0.0.0/16"
    })


    function _handleLinkClick (item) {
        setKey(item.props.itemKey)
    }
    function _next () {
      let curr_key = Number(key)
      let nxt_key = (curr_key + 1) % 4
      if (nxt_key === 2 && app.connectivity === false) nxt_key=3
      setKey(String(nxt_key))
    }

    function mergeState (fn, state,  key, val) {
      fn(Object.assign({}, state, {[key]: val}))
    }
    
    function invalidFn(page, key, invalid) {
      let akey = page+"-"+key
      if (!invalid && invalidArray.includes(akey))  {
        setInvalidArray( invalidArray.filter((v) => v !== akey))
      } else if (invalid && !invalidArray.includes(akey)) {
        setInvalidArray(invalidArray.concat(akey))
      }
    }

    return (
      <div>
        <Pivot selectedKey={key} onLinkClick={_handleLinkClick}>
          
          <PivotItem headerText="Cluster Requirements" itemKey="0">
            <Separator className="notopmargin"/>
            <ClusterScreen vals={cluster} updateFn={(key, val) => mergeState (setCluster, cluster, key, val)} invalidFn={(key, val) => invalidFn("cluster", key, val)} />
            <Separator className="notopmargin"/>
            </PivotItem>
          <PivotItem headerText="Application Requirements" itemKey="1" >
            <Separator className="notopmargin"/>
            <AppScreen cluster={cluster} vals={app} updateFn={(key, val) => mergeState (setApp, app, key, val)} invalidFn={(key, val) => invalidFn("app", key, val)} />
            <Separator className="notopmargin"/>
          </PivotItem>
          <PivotItem headerText="Advanced Connectivity" itemKey="2" headerButtonProps={{disabled: !app.connectivity}} itemIcon={!app.connectivity ? 'StatusCircleBlock' : 'PlugDisconnected'}>
            <Separator className="notopmargin"/>
            <NetworkScreen vals={net} app={app} cluster={cluster} updateFn={(key, val) => mergeState (setNet, net, key, val)} invalidFn={(key, val) => invalidFn("net", key, val)} />
            <Separator className="notopmargin"/>
          </PivotItem>
          <PivotItem headerText="Deploy" itemKey="3">
            <Separator className="notopmargin"/>
            <DeployScreen net={net} app={app} cluster={cluster} invalidArray={invalidArray}/>
            <Separator className="notopmargin"/>
          </PivotItem>
        </Pivot>
        { key !== "3"  &&
          <DefaultButton  disabled={invalidArray.length>0} onClick={_next}>Next</DefaultButton>
        }
      </div>

    )
}

function DeployScreen({net,app,cluster, invalidArray}) {

  const [name, setName] = useState("")
  const [location,setLocation] = useState("WestEurope")
  const [demoapp,setDemoapp] = useState(false)
  const [disablePreviews,setDisablePreviews] = useState(false)


  let deploy_version = "v1.6"
  var queryString = window && window.location.search
  if (queryString) {
    var match = queryString.match('[?&]' + 'v' + '=([^&]+)')
    if (match) {
      deploy_version = match[1]
    }
  }

  let aad_cmd = cluster.useAad ? "-t " +  (cluster.useAltAad ?  cluster.aadid : "current") : ""
  let features = (app.podscale ? " -a podscale " : "") + (app.podid ? "-a podid " :"" ) +  (app.flexvol ? "-a flexvol " :"" ) + (app.ingress !== 'none' ? (` -a ${app.ingress} ` + (app.dns ? ` -a dns=${app.dnsZone.split("/")[4]+"/"+app.dnsZone.split("/")[8]}`: "") + (app.certMan ? ` -a cert=${app.certEmail}`: "")) : "") + (cluster.securityLevel === "high" ? ` -a calico -a afw=AzureCloud.${location} ` : "") + (cluster.connectivity ? " -a vnet " : "") + (net.topology !== 'none' ? net.topology : "") + (cluster.reboot ? " -a kured " : "") + (cluster.autoscale ? ` -a clustrautoscaler=${cluster.nodemax} ` : "") + (cluster.monitor !== 'none' ? " -a aci " : "") + (app.registry !== 'none' ? " -a acr " : "")
  let preview_features = (cluster.securityLevel === "high" ? " -a private-api -a podsec " : "")  


  let deploy_str=`wget -qO - https://github.com/khowling/aks-deploy-arm/tarball/${deploy_version} | \\
    tar xzf - && ( cd khowling-aks-deploy-arm-*; chmod +x ./deploy.sh; \\
    ./deploy.sh -l ${location} ${net.kubenet ? " -n kubenet " : ""} -c ${cluster.nodeinit} ${cluster.vmsku !== 'default' ? "-v " + cluster.vmsku: ""} ${cluster.osdisk >0 ? "-o " + cluster.osdisk: ""} ${demoapp ? "-d" : ""} ${aad_cmd}  \\
    ${features} ${disablePreviews ? "" : preview_features } \\
    ${name} )`

  let invalidname = name.length <5
  return (
    <Stack  tokens={{ childrenGap: 15 }} styles={{ root: { width: 650 } }}>
      <TextField  label="Cluster Name" onChange={(ev,val) => setName(val)} required errorMessage={invalidname ? "Enter valid cluster name" : ""} value={name}  />
      <Dropdown
                  label="Location"
                  selectedKey={location}
                  onChange={(ev,{key}) => setLocation(key)}
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

      <Toggle
          disabled={ (app.ingress === 'none' || !app.dns || !app.certMan)}
          label={<Text>Do you want to install the <Link target="_a" href="https://github.com/khowling/aks-ecomm-demo">Ecommerce demo app</Link> into your cluster with a HTTPS FQDN exposed through an Ingress controller</Text>}
          checked={demoapp} onText="Yes" offText="No" onChange={(ev, checked) => setDemoapp(checked)} />            
      
      { (app.ingress === 'none' || !app.dns || !app.certMan) && 
        <MessageBar  messageBarType={MessageBarType.warning}>To enable the option of deploying a <b>Demo Ecommerce App</b>, go tp the <b>Application Requirements</b> tab, and select an ingress option (Application Gateway or Nginx), and complete the FQDN and Certificate options</MessageBar> 
      }
      <Separator >Deploy Cluster</Separator>

      <Text variant="medium" >Open a Linux shell (requires 'az cli', 'kubectl' & 'helm' pre-installed), or, open the Azure Cloud Shell. <Text variant="medium" style={{fontWeight: "bold"}}>Paste the code below</Text> into the shell</Text>
      { cluster.securityLevel === "high" && 
      <MessageBar  messageBarType={MessageBarType.error}>Your deployment contains Preview features: <b>{ cluster.securityLevel === "high" ? "PodSecurityPolicy, AKSPrivateLinkPreview": ""}</b>, ensure you have registered for the preview before running the script, <Link target="_pv" href="https://github.com/Azure/AKS/blob/master/previews.md">see here</Link>, or disable preview features 
      <Toggle label="Disable Preview Features" onText="Yes" offText="No" checked={disablePreviews} onChange={(ev,checked) => setDisablePreviews(checked)}/>
      </MessageBar>
      
      }
      <TextField label="Command" multiline rows={5} disabled value={deploy_str} errorMessage={invalidname || invalidArray.length>0 ? "Please fix errors before running script" : ""}/>
    
    </Stack>
  )
}

function ClusterScreen ({vals, updateFn, invalidFn}) {

  const [callout, setCallout] = useState(false)
  var _calloutTarget = React.createRef()

  return (
    <Stack  tokens={{ childrenGap: 15 }} styles={{ root: { width: 650 } }}>

        
      <Stack.Item align="start">
        <div ref={_calloutTarget}>
          <ChoiceGroup 
            
            label={<Label>Required Cluster Security Level <Link target="_" href="https://docs.microsoft.com/en-us/azure/aks/concepts-security">docs</Link></Label>}
            defaultSelectedKey={vals.securityLevel}
            onClick={() => setCallout(true)}
            onChange={(ev, {key}) => updateFn("securityLevel", key) }
            options={[
              {
                key: 'normal',
                iconProps: { iconName: 'Lock' },
                text: 'Normal Security'
              },
              {
                key: 'high',
                iconProps: { iconName: 'Encryption' },
                text: 'High Security'
              },
              {
                key: 'max',
                iconProps: { iconName: 'BlockedSiteSolid12' },
                text: 'Highest Security',
                disabled: true
              }
            ]}
          />
        </div>
      </Stack.Item>
        
      { callout && vals.securityLevel === "normal" && (
          <Callout
            className="ms-CalloutExample-callout"
            target={_calloutTarget}
            directionalHint={DirectionalHint.rightCenter}
            isBeakVisible={true}
            gapSpace={10}
            setInitialFocus={true}
            onDismiss={() => setCallout(false)}>
          
            <MessageBar messageBarType={MessageBarType.info}>NORMAL Security Mode Selected</MessageBar>
            <div style={{padding: "10px", maxWidth: "450px"}}>
              <Text >
                This is the simplest AKS deployment to operate, while still providing the following security controls
              </Text>
              <ul>
                <li>Dedicated agent nodes in private VNET</li>
                <li>Disk encryption with Storage Service Encryption (SSE)</li>
                <li>Public API Server endpoint with IP whitelist options (<a target="_wl" href="https://docs.microsoft.com/en-us/azure/aks/api-server-authorized-ip-ranges">here</a>)</li>
                <li>RBAC enabled cluster</li>
                <li>Warning: no restictions on workloads accessing internet</li>
                <li>Warning: no restictions on privileged workloads</li>
              </ul>
            </div>
          </Callout>
      )}


      { callout && vals.securityLevel === "high" && (
          <Callout
            className="ms-CalloutExample-callout"
            target={_calloutTarget}
            directionalHint={DirectionalHint.rightCenter}
            isBeakVisible={true}
            gapSpace={10}
            setInitialFocus={true}
            onDismiss={() => setCallout(false)}>

            <MessageBar messageBarType={MessageBarType.error}>HIGH Security Mode Selected - Advanced (CONTAINS PREVIEW FEATURES)</MessageBar>
            <div style={{padding: "10px", maxWidth: "500px"}}>
              <Text >
                WARNING: This is a highly secure AKS deployment, it is <Text  style={{fontWeight: "bold"}} >more complex</Text> to access & operate. It provides the following additional security controls:
              </Text>
              <ul>
                <li>East-West intra-cluster networking policies (calico)</li>
                <li>(Preview) Private API Server endpoint</li>
                <li>Locked down workload internet access (azure firewall)</li>
                <li>(Preview) Restricted privileged & runasroot workloads (pod-security-policy)</li>
                <li>(Future) Enforcements on your clusters in a centralized manner (azure-policy)</li>
                <li>(Future) Disk encryption (BYOK)</li>
              </ul>
            </div>
          </Callout>
      )}
     
      <Separator className="notopmargin"/>

      <Stack horizontal tokens={{ childrenGap: 142 }} style={ {marginTop: 0}}>
        <Stack.Item>
              <ChoiceGroup  label={ <Label>Cluster User Authentication <Link target="_" href="https://docs.microsoft.com/en-us/azure/aks/azure-ad-integration">docs</Link></Label>} 
            defaultSelectedKey={vals.useAad}
            onChange={(ev, {key}) => updateFn("useAad", key)}
            options={[
              {
                key: false,
                iconProps: { iconName: 'UserWarning' },
                text: 'Kubenetes'
              },
              {
                key: true,
                iconProps: { iconName: 'AADLogo' },
                text: 'AAD Integrated'
              }
            ]}/>
        </Stack.Item>
        <Stack.Item>
        { vals.useAad ? (

          <Stack  tokens={{ childrenGap: 0 }} styles={{ root: { width: 300 } }}>

            <ChoiceGroup
                  styles={{ root: { width: 300 } }}
                  defaultSelectedKey={vals.useAltAad}
                  options={[
                    {
                      key: false,
                      text: 'Use the AKS subscription tenant',
                    },
                    {
                      key: true,
                      text: 'Use alt. tenant',
                      onRenderField: (props, render) => {

                        let invalid = vals.useAad && props.checked && vals.aadid.length !== 36
                        invalidFn ("aadid", invalid)
                        return (
                          <div className={optionRootClass}>
                            {render(props)}
                            <TextField
                            value={vals.aadid}
                            onChange={(ev, val) => updateFn("aadid", val)}
                            errorMessage={ invalid ?"Enter Valid Directory ID" : ""}
                            styles={{root: {marginLeft: 5}}}
                            disabled={props ? !props.checked : false}
                            required placeholder="tenant id" />


                          </div>
                        );
                      }
                    }
                  ]}
                  onChange={(ev, val) => updateFn("useAltAad", val.key)}
                  label={<MessageBar messageBarType={MessageBarType.warning}>Requires Global Admin rights</MessageBar>}
                />
          </Stack>
        ) : invalidFn ("aadid", false) }
        </Stack.Item>
      </Stack>

      <Separator className="notopmargin"/>


      <Label style={ {marginTop: 0}}>Cluster Performance & Scale Requirements</Label>
      <Stack vertical  tokens={{ childrenGap: 15 }} style={{marginTop: 0}} >

        <Stack horizontal tokens={{ childrenGap: 150 }}>
          <Stack.Item>
            <ChoiceGroup defaultSelectedKey={vals.autoscale} onChange={(ev, {key}) => updateFn("autoscale", key) }
              options={[
                {
                  key: false,
                  iconProps: { iconName: 'FollowUser' },
                  text: 'Manual scale'
                },{
                  key: true,
                  iconProps: { iconName: 'ScaleVolume' },
                  text: 'Autoscale'
                }
              ]}/>
          </Stack.Item>
          <Stack.Item>
            <Stack  tokens={{ childrenGap: 0 }} styles={{ root: { width: 300 } }}>
              <Slider label="Initial nodes" min={1} max={10} step={1} defaultValue={vals.nodeinit} showValue={true}
                onChange={(v) => updateFn("nodeinit", v)}/>
            { vals.autoscale && (
              <Slider label="Max nodes" min={5} max={100} step={5} defaultValue={vals.nodemax} showValue={true}
                onChange={(v) => updateFn("nodemax", v)}
                snapToStep/>
            )}
          </Stack>
        </Stack.Item>
      </Stack>


      <Stack horizontal tokens={{ childrenGap: 52 }}>
        <Stack.Item>
          <ChoiceGroup 
              
              defaultSelectedKey="gp"
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
              ]}/>
        </Stack.Item>
        <Stack.Item>
          <Stack  tokens={{ childrenGap: 0 }} styles={{ root: { width: 250 } }}>
              <Dropdown
                  
                  selectedKey={vals.vmsku}
                  onChange={(ev,{key}) => updateFn("vmsku", key)}
                  placeholder="Select VM Size"
                  options={[
                    { key: 'gp', text: 'General purpose', itemType: DropdownMenuItemType.Header },
                    { key: 'default', text: '(D2s v3) 2 vCPU, 8 GB (Max.3200 IOPS)' },
                    { key: 'comp', text: 'Compute optimized', itemType: DropdownMenuItemType.Header },
                    { key: 'Standard_F2s_v2', text: '(F2s v2) 2 vCPU, 4 GB (Max. 3200 IOPS)' },
                  ]}
                  styles={{ dropdown: { width: 300 } }}
                />
              <Dropdown
                  label="Agent OS disk size"
                  selectedKey={vals.osdisk}
                  onChange={(ev,{key}) => updateFn("osdisk", key)}
                  placeholder="Select OS Disk"
                  options={[
                    { key: 'df', text: 'Use the default for the VM size', itemType: DropdownMenuItemType.Header },
                    { key: 0, text: 'default' },
                    { key: 'pd', text: 'Premium SSD Managed Disks', itemType: DropdownMenuItemType.Header },
                    { key: 32, text: '32 GiB (120 IOPS)' },
                    { key: 64, text: '64 GiB (240 IOPS)' },
                    { key: 128, text: '128 GiB (500 IOPS)' },
                  ]}
                  styles={{ dropdown: { width: 300 } }}
                />

          </Stack>
        </Stack.Item>
      </Stack>
      <Checkbox  checked={vals.reboot} onChange={(ev,val) => updateFn("reboot",val)} label="Automatically reboot nodes after scheduled OS updates (kured)"  />

      <Separator className="notopmargin"/>

      <Stack.Item align="start">
        <Label required={true}>
        Cluster Monitoring requirements
        </Label>
        <ChoiceGroup
          defaultSelectedKey={vals.monitor}
          options={[
            { key: 'none', text: 'None, or I will deploy my own managed or oss solution' },
            { key: 'aci',text: 'Microsoft managed addon for for metrics and container logs (azure monitor)'}
            
          ]}
          onChange={(ev, opt) => updateFn("monitor", opt.key)}
        />
      </Stack.Item>

    </Stack>
    </Stack>
  )
}


const columnProps = {
    tokens: { childrenGap: 15 },
    styles: { root: { width: 300 } }
}

function AppScreen ({cluster, vals, updateFn, invalidFn}) {

  const [callout, setCallout] = useState(false)
  let _calloutTarget = React.createRef()

  return (
    <Stack  tokens={{ childrenGap: 15 }} styles={{ root: { width: 650 } }}>

      <Label>Select Default or Custom Networking Connectivity</Label>
      <div ref={_calloutTarget} style={{marginTop: 0, maxWidth: "220px"}}>
        <ChoiceGroup 
          defaultSelectedKey={vals.connectivity}
          onClick={() => setCallout(true)}
          onChange={(ev, {key}) => updateFn("connectivity", key)}
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
    
      { callout && !vals.connectivity && (
          <Callout
            className="ms-CalloutExample-callout"
            target={_calloutTarget}
            directionalHint={DirectionalHint.rightCenter}
            isBeakVisible={true}
            gapSpace={10}
            setInitialFocus={true}
            onDismiss={() => setCallout(false)}>
          
            <MessageBar messageBarType={MessageBarType.info}>Default - Fully Managed Networking</MessageBar>
            <div style={{padding: "10px", maxWidth: "450px"}}>
              <Text >
                Select this option if you <Text  style={{fontWeight: "bold"}} > don't</Text> require any "network layer" connectivity with other VNET or On-Premises networks
                This is the simplest AKS deployment to operate, it provides a <Text  style={{fontWeight: "bold"}} >full managed</Text> network setup
              </Text>
              <ul>
                <li>Dedicated VNET with private IP range for your agents</li>
                <li>Container Networking. Performant PODs networking (CNI)</li>
                <li>Standard LoadBalancer for services (internal or external)</li>
              </ul>
            </div>
          </Callout>
      )}


      { callout && vals.connectivity && (
          <Callout
            className="ms-CalloutExample-callout"
            target={_calloutTarget}
            directionalHint={DirectionalHint.rightCenter}
            isBeakVisible={true}
            gapSpace={10}
            setInitialFocus={true}
            onDismiss={() => setCallout(false)}>

            <MessageBar messageBarType={MessageBarType.warning}>Custom Networking - Advanced Setup</MessageBar>
            <div style={{padding: "10px", maxWidth: "500px"}}>
              <Text >
                Select this option if you need to connect your AKS network with another networks, either through VNET peering or a Expressroute or VPN Gateway.  You will need to complete the <Text  style={{fontWeight: "bold"}} >"Advanced Connectivity"</Text> tab in this wizard   
              </Text>
            </div>
          </Callout>
      )}
        
      <Separator className="notopmargin"/>

      <Stack.Item align="start">
        <Label required={true}>
        Securely Expose your applications to the Internet via HTTPS
        </Label>
        <ChoiceGroup
          defaultSelectedKey={vals.ingress}
          options={[
            { key: 'none',text: 'No, applications will not be exposed, or, I will configure my own solution'},
            { key: 'nginx', text: 'Yes, deploy nginx in the cluster to expose my apps to the internet (nginx ingress controller)' },
            { key: 'appgw', text: 'Yes, deply an Azure Managed Gateway with WAF protection (Application Gateway) ($)' }
          ]}
          onChange={(ev, opt) =>updateFn("ingress", opt.key)}
        />
      </Stack.Item>

      { vals.ingress === "nginx" && cluster.securityLevel === "high" &&
        <MessageBar messageBarType={MessageBarType.warning}>You requested a high security cluster & nginx public ingress. Please ensure you follow this information after deployment <Link target="_ar1" href="https://docs.microsoft.com/en-us/azure/firewall/integrate-lb#public-load-balancer">Asymmetric routing</Link></MessageBar>
      }
      { vals.ingress !== "none" && cluster.securityLevel === "high" &&
        <MessageBar messageBarType={MessageBarType.warning}>You requested a high security cluster. The DNS and Certificate options are disabled as they require additional egress application firewall rules for image download and webhook requirements. You can apply these rules and install the helm chart after provisioning</MessageBar>
      }

      <Stack.Item align="center" styles={{ root: {display: (vals.ingress === "none" ? "none" : "block")}}} >
        <Stack tokens={{ childrenGap: 15 }}>

          <Checkbox disabled={cluster.securityLevel === "high"}  checked={vals.dns} onChange={(ev,v) => updateFn("dns", v)} label={<Text>Create FQDN URLs for your applications (requires <Text style={{fontWeight: "bold"}}>Azure DNS Zone</Text> - <Link href="https://docs.microsoft.com/en-us/azure/dns/dns-getstarted-portal#create-a-dns-zone" target="_t1">how to create</Link>)</Text>} />
          {((show) => {
            //  styles={{ root: {display: (vals.dns ? "block" :  "none" )}}}
           if (show) {
            let invalid = true
            if (vals.dnsZone && vals.dnsZone.length > 100) {
              let resid_array = vals.dnsZone.split("/")
              if (!(resid_array.length !== 9 || resid_array[1] !== "subscriptions" || resid_array[3] !== "resourceGroups" || resid_array[7] !== "dnszones" ||  resid_array[8].indexOf(".") <= 0)) {
                invalid = false
              }
            }
            invalidFn("certMan", invalid)
            return (
              <TextField value={vals.dnsZone} onChange={(ev,v) => updateFn("dnsZone", v)} errorMessage={invalid ? "Enter valid resourceId" : ""} underlined required placeholder="Resource Id" label={<Text style={{fontWeight: 600}}>Enter your Azure DNS Zone ResourceId <Link target="_t2" href="https://ms.portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.Network%2FdnsZones">find it here</Link></Text>} />
            )
           } else {
            invalidFn("certMan", false)
           }
          })(vals.dns && vals.ingress !== 'none')}
          
          <Checkbox  disabled={cluster.securityLevel === "high"} checked={vals.certMan} onChange={(ev,v) =>  updateFn("certMan", v)} label="Automatically Issue Certificates for HTTPS (cert-manager with Lets Encrypt - requires email"  />
          {((show) => {
            //  styles={{ root: {display: (vals.dns ? "block" :  "none" )}}}
            if (show) {
              let invalid = true
              if (vals.certEmail && vals.certEmail.length > 4) {
                let e_array = vals.certEmail.split("@")
                if (!(e_array.length !== 2 || e_array[1] === "example.com" || e_array[1].indexOf(".") <= 0)) {
                  invalid = false
                }
              }
              invalidFn("certEmail", invalid)
             return (
              <TextField value={vals.certEmail} onChange={(ev,v) => updateFn("certEmail", v)} errorMessage={invalid ? "Enter valid resourceId" : ""} label="Enter mail address for certificate notification:" underlined required placeholder="email@address.com" />
             )
           } else {
            invalidFn("certEmail", false)
           }
          })(vals.certMan && vals.ingress !== 'none')}
          
         
        </Stack>
      </Stack.Item>

      <Separator className="notopmargin"/>

      <Stack.Item align="start">
        <Label required={true}>
        Do you require a secure private container registry to store my application images
        </Label>
        <ChoiceGroup
          defaultSelectedKey={vals.registry}
          options={[
            { key: 'none',text: 'No, my application images will be on dockerhub or another registry'},
            { key: 'acr', text: 'Yes, setup Azure Container Registry & secure access to the cluster ($)' }
          ]}
          onChange={(ev, {k}) => updateFn("registry",k)}
        />
      </Stack.Item>

      <Separator className="notopmargin"/>

      <Label required={true}>
      My Application will use the following features (TBC)
        </Label>
      <Stack.Item align="start">
        <Stack tokens={{ childrenGap: 10 }}>
          <Checkbox  checked={vals.flexvol} onChange={(ev,val) => updateFn("flexvol",val)} label="Store kubernetes secrets/certs encrypted in Aure KeyVault  (Azure KeyVault + flexvol)" />
          <Checkbox  checked={vals.podid} onChange={(ev,val) => updateFn("podid",val)} label="My application will operate with an identity secured by Azure AD to access other services (pod identity)"  />
          <Checkbox  checked={vals.podscale} onChange={(ev,val) =>updateFn("podscale",val)} label="Automatically set the 'requests'  based on usage and thus allow proper scheduling onto nodes (vertical-pod-autoscaler)"  />
        </Stack>
      </Stack.Item>

    </Stack>
  )
}



function NetworkScreen ({vals, updateFn, invalidFn, app, cluster}) {

  const [callout, setCallout] = useState(false)
  var _calloutTarget = React.createRef()

  return (
    <Stack  tokens={{ childrenGap: 15 }} styles={{ root: { width: 650 } }}>

      <Stack.Item align="start">
        <div ref={_calloutTarget}>
          <ChoiceGroup 
            
            label={<Label>Select your Network Topology for Network connectivity</Label>}
            defaultSelectedKey={vals.topology}
            onClick={() => setCallout(true)}
            onChange={(ev, {key}) => updateFn("topology", key)}
            options={[
              {
                key: 'none',
                iconProps: { iconName: 'CubeShape' },
                text: 'None'
              },
              {
                key: 'onprem',
                iconProps: { iconName: 'ChromeRestore' },
                text: 'Dedicated (Gateway)'
              },
              {
                key: 'peer',
                iconProps: { iconName: 'SplitObject' },
                text: 'HubSpoke (Peering)',
                disabled: true
              }
            ]}
          />
        </div>
      </Stack.Item>

      { callout && vals.topology === "none" && (
          <Callout
            className="ms-CalloutExample-callout"
            target={_calloutTarget}
            directionalHint={DirectionalHint.rightCenter}
            isBeakVisible={true}
            gapSpace={10}
            setInitialFocus={true}
            onDismiss={() => setCallout(false)}>
          
            <MessageBar messageBarType={MessageBarType.info}>No Connectivity required</MessageBar>
            <div style={{padding: "10px", maxWidth: "450px"}}>
              <Text >
                You can use this option to adjust your IP configuration for future connectivity requirements
              </Text>
            </div>
          </Callout>
      )}
      { callout && vals.topology === "onprem" && (
          <Callout
            className="ms-CalloutExample-callout"
            target={_calloutTarget}
            directionalHint={DirectionalHint.rightCenter}
            isBeakVisible={true}
            gapSpace={10}
            setInitialFocus={true}
            onDismiss={() => setCallout(false)}>
          
            <MessageBar messageBarType={MessageBarType.info}>Dedicated (Gateway)</MessageBar>
            <div style={{padding: "10px", maxWidth: "450px"}}>
              <Text >
                This will create a Gateway subnet in your AKS VNET, and allow you to set the IP address space to ensure non-overlapping address space.  NOTE: You will need to provision your own ExpressRoute or VNET Gateway
              </Text>
            </div>
          </Callout>
      )}


      { callout && vals.topology === "peer" && (
          <Callout
            className="ms-CalloutExample-callout"
            target={_calloutTarget}
            directionalHint={DirectionalHint.rightCenter}
            isBeakVisible={true}
            gapSpace={10}
            setInitialFocus={true}
            onDismiss={() => setCallout(false)}>

            <MessageBar messageBarType={MessageBarType.info}>Hub-Spoke (Peering)</MessageBar>
            <div style={{padding: "10px", maxWidth: "500px"}}>
              <Text >
              Use this option if you want to "peer" your new cluster to a Hub VNET network
              </Text>
            </div>
          </Callout>
      )}
        
      <Separator className="notopmargin"/>
    
      <Toggle
          label="Do you need to limit your non-routable IP usage on your network (use network calculator)"
          checked={vals.kubenet}
          onText="Yes - Use 'kubenet' so your PODs do not receive VNET IPs"
          offText="No - Use 'CNI' for fastest container networking"
          onChange={(ev, checked) => updateFn("kubenet", checked) }
         // styles={{ label: {fontWeight: "regular"}}}
        />

      <Stack horizontal tokens={{ childrenGap: 50 }} styles={{ root: { width: 650 } }}>
        <Stack {...columnProps}>
          <Label>AKS Virtual Network & Subnet CIDRs</Label>
          <Stack.Item align="start">
            <TextField prefix="Vnet" onChange={(ev,val) => updateFn("vnet", val)} value={vals.vnet}  />
          </Stack.Item>
          <Stack.Item align="center">
            <TextField prefix="Subnet" label="AKS Nodes" onChange={(ev,val) => updateFn("akssub", val)} value={vals.akssub}  />
          </Stack.Item>
          <Stack.Item align="center">
            <TextField prefix="Subnet" label="LoadBalancer Services" onChange={(ev,val) => updateFn("ilbsub", val)} value={vals.ilbsub}  />
          </Stack.Item>
          <Stack.Item align="center">
            <TextField prefix="Subnet" disabled={cluster.securityLevel === 'normal'}  label="Azure Firewall" onChange={(ev,val) => updateFn("afwsub", val)} value={cluster.securityLevel !== 'normal' ? vals.afwsub : "N/A"}/>
          </Stack.Item>
          <Stack.Item align="center">
            <TextField prefix="Subnet" disabled={vals.topology !== 'onprem'} label="On-Premises Gateway" onChange={(ev,val) => updateFn("ersub", val)} value={vals.topology === 'onprem' ? vals.ersub : "N/A"} />
          </Stack.Item>
          <Stack.Item align="center">
            <TextField prefix="Subnet" disabled={app.ingress !== 'appgw'} label="Application Gateway" onChange={(ev,val) => updateFn("agsub", val)} value={app.ingress === 'appgw' ? vals.agsub : "N/A"} />
          </Stack.Item>
        </Stack>

        <Stack {...columnProps}>
          <Label>Kubernetes Networking CIDRs</Label>
          <Stack.Item align="start">
            <TextField  label="POD Network" disabled={!vals.kubenet} onChange={(ev,val) => updateFn("pod", val)} value={vals.kubenet ? vals.pod : "N/A"} />
          </Stack.Item>
          <Stack.Item align="start">
            <TextField  label="Service Network" onChange={(ev,val) => updateFn("service", val)} value={vals.service} />
          </Stack.Item>
         
        </Stack>
      </Stack>
    </Stack>
  )
}
