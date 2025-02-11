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

import { LinkOutlined } from '@ant-design/icons'
import { useModule } from '@sigi/react'
import dayjs from 'dayjs'
import { compact, floor } from 'lodash'
import { useCallback, useEffect, useMemo } from 'react'

import { ForeignLink, Space, DateRangeSelector, useQueryString } from '@perfsee/components'
import {
  Chart,
  EChartsOption,
  renderTooltip,
  TooltipRendererParam,
  ChartHeader,
  formatChartData,
} from '@perfsee/components/chart'
import { ArtifactNameSelector, BranchSelector } from '@perfsee/platform/modules/components'
import { useProject, useGenerateProjectRoute } from '@perfsee/platform/modules/shared'
import { PrettyBytes, Size } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { StatisticsModule } from '../../module'
import { CustomTooltip, ColorDot } from '../style'

type DataType = {
  id: number
  hash: string
  artifactName: string
  entryPoint: string
} & Size

const yAxisLabel = {
  formatter: (item: string | number) => `${item} KB`,
}

const xAxisLabel = {
  formatter: (item: string) => `#${item}`,
}

export const ArtifactSizeChart = () => {
  const project = useProject()
  const generateProjectRoute = useGenerateProjectRoute()

  const [
    { startTime = dayjs().subtract(2, 'months').unix(), endTime = dayjs().unix(), branch, name },
    updateQueryString,
  ] = useQueryString<{ startTime: number; endTime: number; branch: string; name: string }>()

  const startDate = useMemo(() => dayjs.unix(startTime).toDate(), [startTime])
  const endDate = useMemo(() => dayjs.unix(endTime).toDate(), [endTime])

  const [{ bundleHistory }, dispatcher] = useModule(StatisticsModule, {
    selector: (state) => ({ bundleHistory: state.bundleHistory }),
    dependencies: [],
  })

  const handleStartDateSelect = useCallback(
    (date?: Date | null) => {
      if (date) {
        updateQueryString({ startTime: dayjs(date).unix() })
      }
    },
    [updateQueryString],
  )

  const handleEndDateSelect = useCallback(
    (date?: Date | null) => {
      if (date) {
        updateQueryString({ endTime: dayjs(date).unix() })
      }
    },
    [updateQueryString],
  )

  const handleBranchSelect = useCallback(
    (branch?: string) => {
      updateQueryString({ branch })
    },
    [updateQueryString],
  )

  const handleArtifactNameSelect = useCallback(
    (artifactName?: string) => {
      updateQueryString({ name: artifactName })
    },
    [updateQueryString],
  )

  useEffect(() => {
    branch &&
      dispatcher.getAggregatedArtifacts({
        length: null,
        from: dayjs.unix(startTime).toISOString(),
        to: dayjs.unix(endTime).toISOString(),
        branch,
        name: name ?? null,
      })
  }, [dispatcher, startTime, endTime, branch, name])

  const { flatData, largest, smallest } = useMemo(() => {
    const data: DataType[] = []
    let largest = 0
    let smallest = Number.MAX_SAFE_INTEGER
    // avoid weird chart looking
    if (!bundleHistory?.length) {
      largest = 1000
      smallest = 0
    } else {
      bundleHistory.forEach(({ artifactName, entrypoint, artifactId, hash, size }) => {
        const record = {
          id: artifactId,
          hash,
          artifactName,
          entryPoint: entrypoint,
          raw: size.raw / 1000,
          gzip: size.gzip / 1000,
          brotli: size.brotli / 1000,
        } as DataType
        largest = Math.max(largest, record.raw)
        smallest = Math.min(smallest, record.raw)
        data.push(record)
      })
    }

    data.sort((a, b) => a.id - b.id)
    return { flatData: data, largest, smallest }
  }, [bundleHistory])

  const { data, groupData } = useMemo(() => {
    return formatChartData<DataType, DataType>(flatData, 'entryPoint', 'id', 'raw')
  }, [flatData])

  const range = useMemo(() => {
    const gap = (largest - smallest) / 2

    if (!gap) {
      return largest / 2
    } else if (gap < 200) {
      return 200
    }

    return gap
  }, [largest, smallest])

  const chartSeries = useMemo<EChartsOption['series']>(() => {
    return Object.entries(data).map(([key, value]) => ({
      type: 'line',
      smooth: true,
      name: key,
      data: value,
    }))
  }, [data])

  const tooltipFormatter = useCallback(
    (_params: TooltipRendererParam) => {
      const params = Array.isArray(_params) ? _params : [_params]

      if (!params.length) {
        return ''
      }

      const items = compact(
        params.map((param) => {
          const { seriesName, data, color } = param
          const [hash] = data as [string]
          if (!seriesName || !hash || !groupData[seriesName]) {
            return null
          }
          return { ...groupData[seriesName][hash], color: color as string }
        }),
      )

      const id = items[0]?.id
      const title = items[0].hash

      const node = (
        <CustomTooltip>
          {id && (
            <p>
              Bundle ID:{' '}
              <ForeignLink href={generateProjectRoute(pathFactory.project.bundle.detail, { bundleId: id })}>
                <LinkOutlined />
                {id}
              </ForeignLink>
            </p>
          )}
          <p>Commit hash: {title}</p>
          <table>
            <thead>
              <tr>
                <th />
                <th>artifact name</th>
                <th>entrypoint</th>
                <th>raw</th>
                <th>gzip</th>
                <th>brotli</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ color, artifactName, entryPoint, raw, gzip, brotli }, i) => (
                <tr key={i}>
                  <td>
                    <ColorDot color={color} />
                  </td>
                  <td>{artifactName}</td>
                  <td>{entryPoint}</td>
                  <td>{PrettyBytes.create(raw * 1000).toString()}</td>
                  <td>{PrettyBytes.create(gzip * 1000).toString()}</td>
                  <td>{PrettyBytes.create(brotli * 1000).toString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CustomTooltip>
      )

      return renderTooltip('artifact-size', node)
    },
    [generateProjectRoute, groupData],
  )

  const option = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        formatter: tooltipFormatter,
      },
      yAxis: {
        axisLabel: yAxisLabel,
        minInterval: 100,
        min: floor(Math.max(0, smallest - range)),
        max: floor(largest + range + 1),
      },
      xAxis: {
        axisLabel: xAxisLabel,
      },
      series: chartSeries,
    }),
    [chartSeries, largest, range, smallest, tooltipFormatter],
  )

  if (!project) {
    return null
  }

  return (
    <Chart option={option} showLoading={!bundleHistory} notMerge={true} hideBorder>
      <ChartHeader title="Bundle Size History">
        <Space wrap>
          <ArtifactNameSelector defaultArtifactName={name} onChange={handleArtifactNameSelect} />
          <BranchSelector defaultBranch={branch} shouldAutoSelect onChange={handleBranchSelect} />
          <DateRangeSelector
            startDate={startDate}
            endDate={endDate}
            onStartDateChanged={handleStartDateSelect}
            onEndDateChanged={handleEndDateSelect}
          />
        </Space>
      </ChartHeader>
    </Chart>
  )
}
