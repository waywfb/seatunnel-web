/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { DagEdgeName, DagNodeName } from './dag-setting'

const stateColor = {
  failed: {
    fill: '#ffced7',
    stroke: '#ffa8b7'
  },
  running: {
    fill: '#ceebff',
    stroke: '#b0deff'
  },
  finished: {
    fill: '#ceffee',
    stroke: '#a8ffe0'
  },
  canceled: {
    fill: '#d5d5d5',
    stroke: '#b6b6b6'
  }
}

const statusLabels: Record<string, string> = {
  RUNNING: '运行中',
  FINISHED: '已完成',
  FAILED: '失败',
  CANCELED: '已取消',
  INITIALIZING: '初始化中',
  WAITING: '等待中'
}

export function buildNodeToolMarkup(node: any, t: any) {
  return [
    {
      tagName: 'text',
      textContent: `数据链路 #${node.pipelineId}`,
      attrs: {
        fill: '#333333',
        'font-size': 14,
        'text-anchor': 'center',
        stroke: 'black'
      }
    },
    {
      tagName: 'text',
      textContent: `状态: ${
        statusLabels[node.status.toUpperCase()] || node.status
      }`,
      attrs: {
        fill: '#868686',
        'font-size': 12,
        'text-anchor': 'start',
        x: '7em'
      }
    },
    {
      tagName: 'text',
      textContent: `${t('project.synchronization_instance.read')} ${
        node.readRowCount
      }${t('project.synchronization_instance.line')}/${t(
        'project.synchronization_instance.write'
      )} ${node.writeRowCount}${t('project.synchronization_instance.line')}`,
      attrs: {
        fill: '#868686',
        'font-size': 12,
        'text-anchor': 'start',
        x: '20em'
      }
    }
  ]
}

function addGroupTool(group: any, node: any, t: any) {
  group.addTools({
    name: 'button',
    args: {
      markup: buildNodeToolMarkup(node, t),
      x: 0,
      y: 0,
      offset: { x: 0, y: -18 }
    }
  })
}

export function updateDagNodeTools(graph: any, summaryList: Array<any>, t: any) {
  summaryList.forEach((item: any) => {
    const group = graph.getCellById('group-' + item.pipelineId)
    if (group) {
      group.removeTools()
      addGroupTool(group, item, t)
    }
  })
}

export function useDagAddShape(
  graph: any,
  nodes: any,
  edges: Array<any>,
  t: any
) {
  for (const i in nodes) {
    const group = graph.addNode({
      id: 'group-' + nodes[i].pipelineId,
      x: 40,
      y: 40,
      width: 360,
      height: 160,
      zIndex: 1,
      attrs: {
        body:
          stateColor[
            nodes[i].status.toLowerCase() as
              | 'failed'
              | 'running'
              | 'finished'
              | 'canceled'
          ] || stateColor.running
      }
    })

    addGroupTool(group, nodes[i], t)

    nodes[i].child.forEach((n: any) => {
      const nodeType =
        (n.nodeType && n.nodeType.toLowerCase()) ||
        (n.label.toLowerCase().includes('source')
          ? 'source'
          : n.label.toLowerCase().includes('sink')
          ? 'sink'
          : 'transform')

      const portItems = []

      group.addChild(
        graph.addNode({
          id: n.id,
          x: 50,
          y: 50,
          width: 180,
          height: 44,
          shape: DagNodeName,
          zIndex: 10,
          ports: {
            items: portItems
          },
          data: {
            name: n.label,
            nodeType: nodeType,
            connectorType: n.label,
            status: 'idle',
            vertexId: n.vertexId
          }
        })
      )
    })
  }

  edges.forEach((e: any) => {
    graph.addEdge({
      shape: DagEdgeName,
      source: {
        cell: e.source,
        port: 'output'
      },
      target: {
        cell: e.target,
        port: 'input'
      },
      id: e.id,
      zIndex: 5,
      data: {
        animated: true
      }
    })
  })
}
