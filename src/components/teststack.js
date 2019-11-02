import React, { useState } from 'react';

import { Stack, Text, Link, FontWeights } from 'office-ui-fabric-react';

const boldStyle = {
    root: { fontWeight: FontWeights.semibold }
  };
  
export default function TestStack () {
    return [
     
      <Text variant="large" styles={boldStyle}>
        Essential Links
      </Text>,
      <Stack horizontal gap={15} horizontalAlign="center">
        <Link href="https://developer.microsoft.com/en-us/fabric">Docs</Link>
        <Link href="https://stackoverflow.com/questions/tagged/office-ui-fabric">Stack Overflow</Link>
        <Link href="https://github.com/officeDev/office-ui-fabric-react/">Github</Link>
        <Link href="https://twitter.com/officeuifabric">Twitter</Link>
      </Stack>,
      <Text variant="large" styles={boldStyle}>
        Design System
      </Text>,
      <Stack horizontal gap={15} horizontalAlign="center">
        <Link href="https://developer.microsoft.com/en-us/fabric#/styles/icons">Icons</Link>
        <Link href="https://developer.microsoft.com/en-us/fabric#/styles/typography">Typography</Link>
        <Link href="https://developer.microsoft.com/en-us/fabric#/styles/themegenerator">Theme</Link>
      </Stack>
    ]
  }