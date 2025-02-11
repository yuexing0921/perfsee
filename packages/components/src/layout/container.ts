/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import styled from '@emotion/styled'

export const BodyContainer = styled.div({
  width: '100%',
  minHeight: '100%',
  padding: '0 80px',
  display: 'flex',
  justifyContent: 'center',
})

export const BodyPadding = styled.div(({ theme }) => ({
  backgroundColor: theme.colors.white,
  width: '100%',
  margin: '20px 0 50px',
  padding: '16px 24px',
  borderRadius: '2px',
  overflow: 'hidden',
}))
