
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

    function _handleLinkClick (item) {
        setKey(item.props.itemKey)
    }
    function _next () {
      setKey(String((key + 1) % 4))
    }
    

    return (
      <div>
        <Pivot selectedKey={key} onLinkClick={_handleLinkClick}>
          
          <PivotItem headerText="Cluster" itemKey="0">
            <Separator/>
            <ClusterScreen/>
            <Separator/>
            </PivotItem>
          <PivotItem headerText="Application" itemKey="1" >
            <Separator/>
            <AppScreen/>
            <Separator/>
          </PivotItem>
          <PivotItem headerText="Advanced Connectivity" itemKey="3" >
            <Separator/>
            <NetworkScreen/>
            <Separator/>
          </PivotItem>

          <PivotItem headerText="Deploy" itemKey="4">
            <Separator/>
            <Separator/>
          </PivotItem>
        </Pivot>
        
        <DefaultButton onClick={_next}>Next</DefaultButton>
      </div>

    )
}

function ClusterScreen () {

  const [callout, setCallout] = useState(false)


  const [sec, setSec] = useState("normal")
  const [autoscale, setAutoscale] = useState(true)
  const [vmsku, setVmsku] = useState("Standard_D2s_v3")
  const [osdisk, setOsdisk] = useState(32)
  const [useAad, setUseAad] = useState(false)
  const [mon, setMon] = useState("none")
  const [aadid, setAadId] = useState("")
  const [reboot, setReboot] = useState(false)
  
  var _calloutTarget = React.createRef()


  return (
    <Stack  tokens={{ childrenGap: 15 }} styles={{ root: { width: 650 } }}>

      <Text  variant="large"  styles={{ root: {  marginTop: "10px" }}}>
      Tell us about the security, performance and feature requirements of your cluster
      </Text>
        
      <Stack.Item align="start">
        <div ref={_calloutTarget}>
          <ChoiceGroup 
            
            label={<Label>Required Cluster Security Level <Link target="_" href="https://docs.microsoft.com/en-us/azure/aks/concepts-security">docs</Link></Label>}
            defaultSelectedKey={sec}
            onClick={() => setCallout(true)}
            onChange={(ev, {key}) => {setSec(key); }}
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
        
      { callout && sec === "normal" && (
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


      { callout && sec === "high" && (
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
        
      <Separator/>

      <Stack horizontal tokens={{ childrenGap: 152 }}>
        <Stack.Item>
              <ChoiceGroup  label={ <Label>Cluster User Authentication <Link target="_" href="https://docs.microsoft.com/en-us/azure/aks/azure-ad-integration">docs</Link></Label>} 
            defaultSelectedKey={useAad}
            onChange={(ev, {key}) => {setUseAad(key); }}
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
        { useAad && (

          <Stack  tokens={{ childrenGap: 0 }} styles={{ root: { width: 300 } }}>

            <ChoiceGroup
                  styles={{ root: { width: 300 } }}
                  defaultSelectedKey="default"
                  options={[
                    {
                      key: 'default',
                      text: 'Use the AKS subscription tenant',
                    },
                    {
                      key: 'B',
                      text: 'Use alt tenant',
                      ariaLabel: 'Mark displayed items as read after - Press tab for further action',
                      onRenderField: (props, render) => {
                        if (!props.checked) setAadId("")
                        return (
                          <div className={optionRootClass}>
                            {render(props)}
                            <TextField
                            value={aadid}
                            onChange={(ev, val) => setAadId(val)}
                            errorMessage={ useAad && props.checked && aadid.length !== 36 ? "Enter Valid Directory ID" : ""}
                            styles={{root: {marginLeft: 5}}}
                            disabled={props ? !props.checked : false}
                            required placeholder="tenant id" />


                          </div>
                        );
                      }
                    }
                  ]}
                  onChange={(ev, val) => console.log (val)}
                  label="Requires Global Admin rights"
                />
          </Stack>
        )}
        </Stack.Item>
      </Stack>

      <Separator/>


      <Label>Cluster Performance & Scale Requirements</Label>
      <Stack vertical  tokens={{ childrenGap: 15 }} style={{marginTop: 0}} >

        <Stack horizontal tokens={{ childrenGap: 150 }}>
          <Stack.Item>
            <ChoiceGroup defaultSelectedKey={autoscale} onChange={(ev, {key}) => {setAutoscale(key); }}
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
            <Stack  tokens={{ childrenGap: 0 }} styles={{ root: { width: 250 } }}>
              <Slider label="Initial nodes" min={1} max={10} step={1} defaultValue={2} showValue={true}
                onChange={(value) => console.log(value)}/>
            { autoscale && (
              <Slider label="Max nodes" min={5} max={100} step={5} defaultValue={20} showValue={true}
                onChange={(value) => console.log(value)}
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
                  selectedKey={vmsku}
                  onChange={(ev,{key}) => setVmsku(key)}
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
                  selectedKey={osdisk}
                  onChange={(ev,{key}) => setOsdisk(key)}
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
      <Checkbox  checked={reboot} onChange={(ev,val) => setReboot(val)} label="Automatically reboot nodes after scheduled OS updates (kured)"  />
       

      
      <Separator/>

      <Stack.Item align="start">
        <Label required={true}>
        Cluster Monitoring requirements
        </Label>
        <ChoiceGroup
          defaultSelectedKey={mon}
          options={[
            { key: 'none', text: 'None, or I will deploy my own managed or oss solution' },
            { key: 'aci',text: 'Microsoft managed addon for for metrics and container logs (azure monitor)'}
            
          ]}
          onChange={(ev, opt) => setMon (opt.key)}
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

function AppScreen () {

  const [callout, setCallout] = useState(false)

  const [appVnet, setAppVnet] = useState(false)
  const [ingress, setIngress] = useState('none')
  const [certMan, setCertMan] = useState(false)
  const [dns, setDns] = useState(false)
  const [reg, setReg] = useState('none')
  const [flexvol, setFlexvol] = useState(false)
  const [podid, setPodid] = useState(false)
  const [podscale, setPodscale] = useState(false)

  let _calloutTarget = React.createRef()

  return (
    <Stack  tokens={{ childrenGap: 15 }} styles={{ root: { width: 650 } }}>

      <Text  variant="large" styles={{ root: {  marginTop: "10px" }}}>
      Tell us about the requirements of your applications to be deployed in the cluster
      </Text>


      <Label>Select Default or Custom Networking Connectivity</Label>
      <div ref={_calloutTarget} style={{marginTop: 0, maxWidth: "220px"}}>
        <ChoiceGroup 
          defaultSelectedKey={appVnet}
          onClick={() => setCallout(true)}
          onChange={(ev, {key}) => {setAppVnet(key); }}
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
    
      { callout && !appVnet && (
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


      { callout && appVnet && (
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
          defaultSelectedKey={ingress}
          options={[
            { key: 'none',text: 'No, applications will not be exposed, or, I will configure my own solution'},
            { key: 'nginx', text: 'Yes, deploy nginx in the cluster to expose my apps to the internet (nginx ingress controller)' },
            { key: 'appgw', text: 'Yes, deply an Azure Managed Gateway with WAF protection (Application Gateway) ($)' }
          ]}
          onChange={(ev, opt) => setIngress (opt.key)}
        />
      </Stack.Item>

      <Stack.Item align="center" styles={{ root: {display: (ingress === "none" ? "none" : "block")}}} >
        <Stack tokens={{ childrenGap: 15 }}>
          <Checkbox  checked={dns} onChange={(ev,val) => setDns(val)} label="Register DNS names for your applications (requires a Azure DNS Zone)" />
          <TextField styles={{ root: {display: (dns ? "block" :  "none" )}}} label="Enter the ResourceGroup/Name of your Azure DNS Zone:" underlined required placeholder="rg/zone" />
          <Checkbox  checked={certMan} onChange={(ev,val) => setCertMan(val)} label="Automatically Issue Certificates for HTTPS (cert-manager with Lets Encrypt - requires email"  />
          <TextField styles={{ root: {display: (certMan ? "block" :  "none" )}}} label="Enter mail address for certificate notification:" underlined required placeholder="email@address.com" />
        </Stack>
      </Stack.Item>

      <Separator/>

      <Stack.Item align="start">
        <Label required={true}>
        Do you require a secure private container registry to store my application images
        </Label>
        <ChoiceGroup
          defaultSelectedKey={reg}
          options={[
            { key: 'none',text: 'No, my application images will be on dockerhub or another registry'},
            { key: 'acr', text: 'Yes, setup Azure Container Registry & secure access to the cluster ($)' }
          ]}
          onChange={(ev, opt) => setReg (opt.key)}
        />
      </Stack.Item>

      <Separator/>

      <Label required={true}>
      My Application will use the following features (TBC)
        </Label>
      <Stack.Item align="start">
        <Stack tokens={{ childrenGap: 10 }}>
          <Checkbox  checked={flexvol} onChange={(ev,val) => setFlexvol(val)} label="Store kubernetes secrets/certs encrypted in Aure KeyVault  (Azure KeyVault + flexvol)" />
          <Checkbox  checked={podid} onChange={(ev,val) => setPodid(val)} label="My application will operate with an identity secured by Azure AD to access other services (pod identity)"  />
          <Checkbox  checked={podscale} onChange={(ev,val) => setPodscale(val)} label="Automatically set the 'requests'  based on usage and thus allow proper scheduling onto nodes (vertical-pod-autoscaler)"  />
        </Stack>
      </Stack.Item>

    </Stack>
  )
}



function NetworkScreen () {

  const [callout, setCallout] = useState(false)
  const [topology, setTopology] = useState ('none')
  const [kubenet, setKubenet] = useState (false)
  const [vnet, setVnet] = useState ("10.0.0.0/8")

  var _calloutTarget = React.createRef()

  return (
    <Stack  tokens={{ childrenGap: 15 }} styles={{ root: { width: 650 } }}>

      <Text  variant="large"  styles={{ root: {  marginTop: "10px" }}}>
      Complete this Screen if you selected "Custom Networking" in application requiremetns
      </Text>
        
      <Stack.Item align="start">
        <div ref={_calloutTarget}>
          <ChoiceGroup 
            
            label={<Label>Select your Network Topology for Network connectivity</Label>}
            defaultSelectedKey={topology}
            onClick={() => setCallout(true)}
            onChange={(ev, {key}) => {setTopology(key); }}
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

      { callout && topology === "none" && (
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
      { callout && topology === "er" && (
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


      { callout && topology === "hs" && (
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
          checked={kubenet}
          onText="Yes - switch to 'kubenet', so your PODs do not receive VNET IPs"
          offText="No - continue to use CNI for fast container networking"
          onChange={(ev, checked) => setKubenet(checked) }
         // styles={{ label: {fontWeight: "regular"}}}
        />

      <Stack horizontal tokens={{ childrenGap: 50 }} styles={{ root: { width: 650 } }}>
      <Stack {...columnProps}>
          <TextField label="VNET CIDR"  value={vnet} onChange={(ev,val) => setVnet(val)} />

          <TextField label="With an icon" iconProps={{ iconName: 'Calendar' }} />

          <TextField label="With placeholder" placeholder="Please enter text here" />
          <TextField label="Disabled with placeholder" disabled placeholder="I am disabled" />
        </Stack>

        <Stack {...columnProps}>



          <TextField label="Standard" />
          <TextField label="Disabled" disabled defaultValue="I am disabled" />
          <TextField label="Read-only" readOnly defaultValue="I am read-only" />
          <TextField label="Required " required />
          <TextField required />
          <TextField label="With error message" errorMessage="Error message" />
        </Stack>

        
      </Stack>
    </Stack>
  )
}
