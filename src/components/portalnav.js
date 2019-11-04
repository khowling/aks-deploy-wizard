
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
        sec: "normal",
        autoscale: true,
        nodeinit: 2,
        nodemax: 20,
        vmsku: "Standard_D2s_v3",
        osdisk: 32,
        useAad: false,
        useAltAad: false,
        aadid: "",
        mon: "none",
        reboot: false
    })
    const [app, setApp] = useState({
      appVnet: false,
      ingress: 'none',
      certMan: false,
      certEmail: "",
      dns: false,
      dnsZone: "",
      reg: 'none',
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
      if (nxt_key === 2 && app.appVnet === false) nxt_key=3
      setKey(String(nxt_key))
    }

    function mergeState (fn, state,  key, val) {
      fn(Object.assign({}, state, {[key]: val}))
      console.log (state)
    }
    
    function invalidFn(page, key, invalid) {
      let akey = page+"-"+key
      console.log (invalidArray)
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
            <Separator/>
            <ClusterScreen vals={cluster} updateFn={(key, val) => mergeState (setCluster, cluster, key, val)} invalidFn={(key, val) => invalidFn("cluster", key, val)} />
            <Separator/>
            </PivotItem>
          <PivotItem headerText="Application Requirements" itemKey="1" >
            <Separator/>
            <AppScreen vals={app} updateFn={(key, val) => mergeState (setApp, app, key, val)} invalidFn={(key, val) => invalidFn("app", key, val)} />
            <Separator/>
          </PivotItem>
          <PivotItem headerText="Advanced Connectivity" itemKey="2" headerButtonProps={{disabled: !app.appVnet}} itemIcon={!app.appVnet ? 'ChromeClose' : 'CityNext'}>
            <Separator/>
            <NetworkScreen vals={net} updateFn={(key, val) => mergeState (setNet, net, key, val)} invalidFn={(key, val) => invalidFn("net", key, val)} />
            <Separator/>
          </PivotItem>
          <PivotItem headerText="Deploy" itemKey="3">
            <Separator/>
            <DeployScreen net={net} app={app} cluster={cluster}/>
            <Separator/>
          </PivotItem>
        </Pivot>
        
        <DefaultButton disabled={invalidArray.length>0} onClick={_next}>Next</DefaultButton>
      </div>

    )
}

function DeployScreen({net,app,cluster}) {

  const [name, setName] = useState("")
  const [location,setLocation] = useState("westeurope")

  
  let deploy_str=`wget -qO - https://github.com/khowling/aks-deploy-arm/tarball/v1.6 | \
  tar xzf - && ( cd khowling-aks-deploy-arm-*; chmod +x ./deploy.sh; \
    ./deploy.sh -n azure -t current -a " kured  clustrautoscaler  aci  acr " ${name} )`


  return (
    <Stack  tokens={{ childrenGap: 15 }} styles={{ root: { width: 650 } }}>
      <TextField  label="Cluster Name" onChange={(ev,val) => setName(val)} value={name}  />
      <Dropdown
                  label="Location"
                  selectedKey={location}
                  onChange={(ev,{key}) => setLocation(key)}
                  options={[
                    { key: 'europe', text: 'Europe', itemType: DropdownMenuItemType.Header },
                    { key: "westeurope", text: "West Europe" },
                    { key: "uksouth", text: "UK South" }
                  ]}
                  styles={{ dropdown: { width: 300 } }}
                />

      <Separator/>

      <TextField label="Command" multiline rows={3} disabled value={deploy_str} />
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
            defaultSelectedKey={vals.sec}
            onClick={() => setCallout(true)}
            onChange={(ev, {key}) => updateFn("sec", key) }
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
        
      { callout && vals.sec === "normal" && (
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
                <li>Public api server endpoint with ip whitelist options</li>
                <li>RBAC enabled cluster</li>
                <li>Warning: no restictions on workloads accessing internet</li>
                <li>Warning: no restictions on privileged workloads</li>
              </ul>
            </div>
          </Callout>
      )}


      { callout && vals.sec === "high" && (
          <Callout
            className="ms-CalloutExample-callout"
            target={_calloutTarget}
            directionalHint={DirectionalHint.rightCenter}
            isBeakVisible={true}
            gapSpace={10}
            setInitialFocus={true}
            onDismiss={() => setCallout(false)}>

            <MessageBar messageBarType={MessageBarType.warning}>HIGH Security Mode Selected - Advanced</MessageBar>
            <div style={{padding: "10px", maxWidth: "500px"}}>
              <Text >
                WARNING: This is a highly secure AKS deployment, it is <Text  style={{fontWeight: "bold"}} >more complex</Text> to access & operate. It provides the following additional security controls:
              </Text>
              <ul>
                <li>East-West intra-cluster networking policies (calico)</li>
                <li>(future) Private api server endpoint (requires jumpbox)</li>
                <li>Locked down workload internet access (azure firewall)</li>
                <li>Restricted privileged & runasroot workloads (pod sec policy)</li>
                <li>(future) Trusted containers and authorised deployments (gatekeeper)</li>
                <li>(future) Disk encryption (BYOK)</li>
              </ul>
            </div>
          </Callout>
      )}
        
      <Separator style={{marginTop: 0}}/>

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

      <Separator/>


      <Label style={ {marginTop: 0}}>Cluster Performance & Scale Requirements</Label>
      <Stack vertical  tokens={{ childrenGap: 15 }} style={{marginTop: 0}} >

        <Stack horizontal tokens={{ childrenGap: 150 }}>
          <Stack.Item>
            <ChoiceGroup defaultSelectedKey={vals.autoscale} onChange={(ev, {key}) => updateFn("autoscale", key) }
              options={[
                {
                  key: true,
                  iconProps: { iconName: 'ScaleVolume' },
                  text: 'Autoscale'
                },{
                  key: false,
                  iconProps: { iconName: 'FollowUser' },
                  text: 'Manual scale'
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
                  label="Agent VM"
                  selectedKey={vals.vmsku}
                  onChange={(ev,{key}) => updateFn("vmsku", key)}
                  placeholder="Select VM Size"
                  options={[
                    { key: 'gp', text: 'General purpose', itemType: DropdownMenuItemType.Header },
                    { key: 'Standard_D2s_v3', text: '2 vCPU, 8 GB (Max.3200 IOPS)' },
                    { key: 'comp', text: 'Compute optimized', itemType: DropdownMenuItemType.Header },
                    { key: 'Standard_F2s_v2', text: '2 vCPU, 4 GB (Max. 3200 IOPS)' },
                  ]}
                  styles={{ dropdown: { width: 300 } }}
                />
              <Dropdown
                  label="Agent OS disk"
                  selectedKey={vals.osdisk}
                  onChange={(ev,{key}) => updateFn("osdisk", key)}
                  placeholder="Select OS Disk"
                  options={[
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

      <Separator/>

      <Stack.Item align="start">
        <Label required={true}>
        Cluster Monitoring requirements
        </Label>
        <ChoiceGroup
          defaultSelectedKey={vals.mon}
          options={[
            { key: 'none', text: 'None, or I will deploy my own managed or oss solution' },
            { key: 'aci',text: 'Microsoft managed addon for for metrics and container logs (azure monitor)'}
            
          ]}
          onChange={(ev, opt) => updateFn("mon", opt.key)}
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

function AppScreen ({vals, updateFn, invalidFn}) {

  const [callout, setCallout] = useState(false)
  let _calloutTarget = React.createRef()

  return (
    <Stack  tokens={{ childrenGap: 15 }} styles={{ root: { width: 650 } }}>

      <Label>Select Default or Custom Networking Connectivity</Label>
      <div ref={_calloutTarget} style={{marginTop: 0, maxWidth: "220px"}}>
        <ChoiceGroup 
          defaultSelectedKey={vals.appVnet}
          onClick={() => setCallout(true)}
          onChange={(ev, {key}) => updateFn("appVnet", key)}
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
    
      { callout && !vals.appVnet && (
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


      { callout && vals.appVnet && (
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
        
      <Separator/>

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

      <Stack.Item align="center" styles={{ root: {display: (vals.ingress === "none" ? "none" : "block")}}} >
        <Stack tokens={{ childrenGap: 15 }}>
          <Checkbox  checked={vals.dns} onChange={(ev,v) => updateFn("dns", v)} label={<Text>Create FQDN URLs for your applications (requires Azure DNS Zone <Link href="https://docs.microsoft.com/en-us/azure/dns/dns-getstarted-portal#create-a-dns-zone" target="_t">instructions</Link>)</Text>} />
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
              <TextField value={vals.dnsZone} onChange={(ev,v) => updateFn("dnsZone", v)} errorMessage={invalid ? "Enter valid resourceId" : ""} label={<Text>Enter the ResourceId of your Azure DNS Zone <Link target="_t" href="https://ms.portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.Network%2FdnsZones">here</Link></Text>} />
            )
           } else {
            invalidFn("certMan", false)
           }
          })(vals.dns)}
          <Checkbox  checked={vals.certMan} onChange={(ev,v) =>  updateFn("certMan", v)} label="Automatically Issue Certificates for HTTPS (cert-manager with Lets Encrypt - requires email"  />
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
          })(vals.certMan)}
          
         
        </Stack>
      </Stack.Item>

      <Separator/>

      <Stack.Item align="start">
        <Label required={true}>
        Do you require a secure private container registry to store my application images
        </Label>
        <ChoiceGroup
          defaultSelectedKey={vals.reg}
          options={[
            { key: 'none',text: 'No, my application images will be on dockerhub or another registry'},
            { key: 'acr', text: 'Yes, setup Azure Container Registry & secure access to the cluster ($)' }
          ]}
          onChange={(ev, {k}) => updateFn("reg",k)}
        />
      </Stack.Item>

      <Separator/>

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



function NetworkScreen ({vals, updateFn, invalidFn}) {

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
                key: 'er',
                iconProps: { iconName: 'ChromeRestore' },
                text: 'Dedicated (Gateway)'
              },
              {
                key: 'hs',
                iconProps: { iconName: 'SplitObject' },
                text: 'HubSpoke (Peering)',
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
      { callout && vals.topology === "er" && (
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


      { callout && vals.topology === "hs" && (
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
        
      <Separator/>
    
      <Toggle
          label="Do you need to limit your non-routable IP usage on your network (use network calculator)"
          checked={vals.kubenet}
          onText="Yes - Using 'kubenet' so your PODs do not receive VNET IPs"
          offText="No - Using 'CNI' for fast container networking"
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
            <TextField prefix="Subnet" label="Azure Firewall" onChange={(ev,val) => updateFn("afwsub", val)} value={vals.afwsub}/>
          </Stack.Item>
          <Stack.Item align="center">
            <TextField prefix="Subnet" label="On-Premises Gateway" onChange={(ev,val) => updateFn("ersub", val)} value={vals.ersub} />
          </Stack.Item>
          <Stack.Item align="center">
            <TextField prefix="Subnet" label="Application Gateway" onChange={(ev,val) => updateFn("agsub", val)} disabled value={vals.agsub} />
          </Stack.Item>
        </Stack>

        <Stack {...columnProps}>
          <Label>Kubernetes Networking CIDRs</Label>
          <Stack.Item align="start">
            <TextField  label="POD Network" onChange={(ev,val) => updateFn("pod", val)} value={vals.pod} />
          </Stack.Item>
          <Stack.Item align="start">
            <TextField  label="Service Network" onChange={(ev,val) => updateFn("service", val)} value={vals.service} />
          </Stack.Item>
         
        </Stack>
      </Stack>
    </Stack>
  )
}
