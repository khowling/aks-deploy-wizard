import React from 'react';

import PortalNav from './components/portalnav'
import { Stack, Text, FontWeights } from 'office-ui-fabric-react';

const boldStyle = {
  root: { fontWeight: FontWeights.semibold }
};

export default function App() {
  return (
    <Stack verticalFill
    styles={{ root: { width: '960px', margin: '0 auto', color: '#605e5c'}}}
    gap={15}
  >

      <Text variant="xLarge" styles={boldStyle}>
        Welcome to AKS Deploy
      </Text>
      <Text variant="large">Tell us the requirements of your AKS deployment, and we will generate the configuration to create your cluster, incorporating all Microsoft's best-practics guidence </Text>
      <PortalNav/>
    </Stack>
  )
}

