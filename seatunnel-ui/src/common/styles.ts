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

import { CSSProperties } from 'vue'

export const cardStyles: CSSProperties = {
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-card)',
  padding: '16px 20px'
}

export const cardHeaderStyles: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '8px'
}

export const cardTitleStyles: CSSProperties = {
  fontWeight: 600,
  fontSize: '14px',
  color: 'var(--color-primary)',
  cursor: 'pointer',
  lineHeight: 1.4
}

export const cardContentStyles: CSSProperties = {
  fontSize: '13px',
  color: 'var(--color-foreground)'
}

export const cardFooterStyles: CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginTop: '2px'
}

export const cardMetaStyles: CSSProperties = {
  display: 'flex',
  gap: '12px',
  fontSize: '12px',
  color: 'var(--color-muted-foreground)'
}

export const statCardContainerStyles: CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)'
}

export const taskCardGridStyles: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
  gap: '12px',
  marginBottom: '16px'
}
