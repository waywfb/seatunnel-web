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

import type { GlobalThemeOverrides } from 'naive-ui'

const light: GlobalThemeOverrides = {
  common: {
    bodyColor: '#F8FAFC',

    /**************** Brand color */
    primaryColor: '#1E40AF',
    primaryColorHover: '#2563EB',
    primaryColorPressed: '#1D4ED8',
    primaryColorSuppl: '#1E40AF',

    /**************** Function of color */
    infoColor: '#2563EB',
    successColor: '#16A34A',
    warningColor: '#D97706',
    errorColor: '#DC2626'
  }
}

export default light
