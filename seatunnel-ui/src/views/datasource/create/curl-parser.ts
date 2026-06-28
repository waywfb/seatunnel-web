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

export interface CurlParseResult {
  url: string
  method: string
  headers: Record<string, string>
  params: Record<string, string>
  body: string
  format: string
}

function tokenize(input: string): string[] {
  const tokens: string[] = []
  let i = 0
  let current = ''

  while (i < input.length) {
    const ch = input[i]

    if (ch === '\\' && i + 1 < input.length && input[i + 1] === '\n') {
      current += ' '
      i += 2
      continue
    }

    if (ch === '\'' || ch === '"') {
      const quote = ch
      i++
      while (i < input.length && input[i] !== quote) {
        if (input[i] === '\\' && i + 1 < input.length) {
          current += input[i + 1]
          i += 2
        } else {
          current += input[i]
          i++
        }
      }
      if (i < input.length) i++
      continue
    }

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      if (current.length > 0) {
        tokens.push(current)
        current = ''
      }
      i++
      continue
    }

    current += ch
    i++
  }

  if (current.length > 0) {
    tokens.push(current)
  }

  return tokens
}

function parseUrlParams(url: string): { baseUrl: string; params: Record<string, string> } {
  const qIndex = url.indexOf('?')
  if (qIndex === -1) {
    return { baseUrl: url, params: {} }
  }

  const baseUrl = url.substring(0, qIndex)
  const query = url.substring(qIndex + 1)
  const params: Record<string, string> = {}

  for (const part of query.split('&')) {
    const eqIndex = part.indexOf('=')
    if (eqIndex === -1) {
      params[decodeURIComponent(part)] = ''
    } else {
      params[decodeURIComponent(part.substring(0, eqIndex))] =
        decodeURIComponent(part.substring(eqIndex + 1))
    }
  }

  return { baseUrl, params }
}

export function parseCurl(input: string): CurlParseResult {
  const result: CurlParseResult = {
    url: '',
    method: 'GET',
    headers: {},
    params: {},
    body: '',
    format: 'json'
  }

  const trimmed = input.trim()
  if (!trimmed.toLowerCase().startsWith('curl ')) {
    return result
  }

  const tokens = tokenize(trimmed)

  let urlFound = false

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i]

    if (token === '-X' || token === '--request' || token === '-request') {
      if (i + 1 < tokens.length) {
        result.method = tokens[++i].toUpperCase()
      }
      continue
    }

    if (token === '-H' || token === '--header' || token === '-header') {
      if (i + 1 < tokens.length) {
        const header = tokens[++i]
        const colonIndex = header.indexOf(':')
        if (colonIndex !== -1) {
          const key = header.substring(0, colonIndex).trim()
          const value = header.substring(colonIndex + 1).trim()
          result.headers[key] = value
        }
      }
      continue
    }

    if (token === '-d' || token === '--data' || token === '-data' ||
        token === '--data-raw' || token === '-data-raw' ||
        token === '--data-binary' || token === '-data-binary' ||
        token === '--data-ascii' || token === '-data-ascii') {
      if (i + 1 < tokens.length) {
        result.body = tokens[++i]
      }
      continue
    }

    if (token.startsWith('-') || token.startsWith('--')) {
      if (i + 1 < tokens.length && !tokens[i + 1].startsWith('-')) {
        i++
      }
      continue
    }

    if (!urlFound && (token.startsWith('http://') || token.startsWith('https://') || token.startsWith('ftp://'))) {
      result.url = token
      const { baseUrl, params } = parseUrlParams(token)
      result.url = baseUrl
      Object.assign(result.params, params)
      urlFound = true
    }
  }

  if (result.body && result.method === 'GET') {
    result.method = 'POST'
  }

  return result
}

export function curlParseResultToFormValues(result: CurlParseResult): Record<string, string> {
  const values: Record<string, string> = {}

  values.url = result.url

  values.method = result.method

  if (Object.keys(result.headers).length > 0) {
    values.headers = JSON.stringify(result.headers, null, 2)
  }

  if (Object.keys(result.params).length > 0) {
    values.params = JSON.stringify(result.params, null, 2)
  }

  values.body = result.body

  values.format = result.format

  return values
}
