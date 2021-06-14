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