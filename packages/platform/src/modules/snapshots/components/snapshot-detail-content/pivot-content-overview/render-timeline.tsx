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

import { css, useTheme } from '@emotion/react'
import { Stack } from '@fluentui/react'
import { FC } from 'react'

import { formatTime } from '@perfsee/platform/common'
import { TimelineSchema } from '@perfsee/shared'

import { TimelineCell } from './style'

type Props = {
  timelines: TimelineSchema[]
}

export const RenderTimeline: FC<Props> = ({ timelines }) => {
  const theme = useTheme()

  return (
    <Stack horizontal tokens={{ childrenGap: '8px' }} wrap>
      {timelines.map((timeline) => {
        const { value, unit } = formatTime(timeline.timing)
        return (
          <TimelineCell key={timeline.timing}>
            <div css={css({ color: theme.text.colorSecondary })}>
              <span>{value}</span>
              <span css={css({ fontSize: '12px', marginLeft: '5px' })}>{unit}</span>
            </div>
            <img
              css={css({ marginTop: '10px', border: `solid 1px ${theme.border.color}` })}
              width={120}
              src={timeline.data}
              alt="Snapshot"
            />
          </TimelineCell>
        )
      })}
    </Stack>
  )
}
