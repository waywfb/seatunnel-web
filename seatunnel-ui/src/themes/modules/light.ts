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
import type { GlobalThemeOverrides } from '../type'

const light: GlobalThemeOverrides = {
  common: {
    bodyColor: '#faf8ff',

    /**************** Brand color */
    primaryColor: '#00685f',
    primaryColorHover: '#008378',
    primaryColorPressed: '#005049',
    primaryColorSuppl: '#00685f',

    /**************** Function of color */
    infoColor: '#1DA7B4',
    successColor: '#10B981',
    warningColor: '#D97B29',
    errorColor: '#BE123C',

    /**************** Text */
    textColor1: '#131b2e',
    textColor2: '#3d4947',
    textColor3: '#6d7a77',

    /**************** Border */
    borderColor: '#bcc9c6',
    dividerColor: '#bcc9c6',

    /**************** Placeholder */
    placeholderColor: '#9CA3AF',
    placeholderColorDisabled: '#D1D5DB',

    /**************** Focus */

    /**************** Opacity */
    opacityDisabled: '0.5',
    fontWeight: '400',
    fontWeightStrong: '500',

    /**************** Radius */
    borderRadius: '4px',
    borderRadiusSmall: '4px'
  },

  Layout: {
    color: '#faf8ff',
    headerColor: '#ffffff',
    siderColor: '#ffffff',
  },

  Menu: {
    itemColorActive: '#e2f0ee',
    itemColorActiveHover: '#d0e8e5',
    itemTextColor: '#3d4947',
    itemTextColorActive: '#00685f',
    itemTextColorChildActive: '#00685f',
    itemTextColorHover: '#131b2e',
    itemTextColorChildActiveHover: '#008378',
    itemIconColor: '#6d7a77',
    itemIconColorActive: '#00685f',
    itemIconColorHover: '#3d4947',
    itemColorHover: '#f0f7f5',
    itemHeight: '40px',
    borderRadius: '4px',
    color: '#ffffff',
    groupTextColor: '#9CA3AF',
    arrowColor: '#6d7a77'
  },

  Table: {
    thColor: '#f2f6f5',
    thColorModal: '#f2f6f5',
    thColorPopover: '#f2f6f5',
    thTextColor: '#3d4947',
    thFontWeight: '600',
    tdColor: '#ffffff',
    tdColorModal: '#ffffff',
    tdColorPopover: '#ffffff',
    tdTextColor: '#131b2e',
    borderColor: '#bcc9c6',
    borderColorModal: '#bcc9c6',
    borderColorPopover: '#bcc9c6',
  },

  Button: {
    color: '#00685f',
    colorHover: '#008378',
    colorPressed: '#005049',
    colorFocus: '#00685f',
    textColor: '#ffffff',
    textColorHover: '#ffffff',
    textColorPressed: '#ffffff',
    textColorFocus: '#ffffff',
    border: '1px solid transparent',
    borderHover: '1px solid transparent',
    borderPressed: '1px solid transparent',
    borderFocus: '1px solid transparent',
    textColorDisabled: '#9CA3AF',
    opacityDisabled: '0.5',
    fontWeight: '500',

    /* Secondary */
    colorSecondary: '#ffffff',
    colorSecondaryHover: '#faf8ff',
    colorSecondaryPressed: '#f0f7f5',

    /* Error / Destructive */
    colorError: '#BE123C',
    textColorError: '#ffffff',

    /* Warning */
    colorWarning: '#D97B29',
    textColorWarning: '#ffffff',

    /* Success */
    colorSuccess: '#10B981',
    textColorSuccess: '#ffffff',

    /* Info */
    colorInfo: '#1DA7B4',
    textColorInfo: '#ffffff',

    /* Ghost */
    textColorGhost: '#3d4947',
    textColorGhostHover: '#131b2e',

    /* Text (link-like) */
    textColorText: '#00685f',
    textColorTextHover: '#008378',
    textColorTextPressed: '#005049'
  },

  Input: {
    color: '#ffffff',
    textColor: '#131b2e',
    placeholderColor: '#9CA3AF',
    border: '1px solid #bcc9c6',
    borderHover: '1px solid #6d7a77',
    borderFocus: '1px solid #00685f',
    boxShadowFocus: '0 0 0 2px rgba(0, 104, 95, 0.2)',
    borderError: '1px solid #BE123C',
    boxShadowFocusError: '0 0 0 2px rgba(190, 18, 60, 0.2)',
    colorDisabled: '#f0f7f5',
    textColorDisabled: '#D1D5DB',
    borderRadius: '4px',
    iconSize: '18px'
  },

  Select: {
    menuBoxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  },

  Card: {
    color: '#ffffff',
    colorModal: '#ffffff',
    colorPopover: '#ffffff',
    borderColor: '#bcc9c6',
    borderRadius: '8px',
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    titleFontWeight: '500',
    titleTextColor: '#131b2e'
  },

  Dialog: {
    color: '#ffffff',
    border: '1px solid #bcc9c6',
    borderRadius: '8px',
    titleFontSize: '16px',
    titleFontWeight: '600',
    titleTextColor: '#131b2e',
    actionSpace: '16px'
  },

  Tooltip: {
    color: '#131b2e',
    textColor: '#faf8ff',
    borderRadius: '4px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)'
  },

  Popover: {
    color: '#ffffff',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    padding: '12px',
    fontSize: '14px',
    textColor: '#3d4947'
  },

  Checkbox: {
    color: '#ffffff',
    colorChecked: '#00685f',
    border: '1px solid #bcc9c6',
    borderFocus: '1px solid #00685f',
    borderRadius: '4px',
    textColor: '#131b2e',
  },

  Radio: {
    textColor: '#3d4947'
  },

  Switch: {
    railColor: '#bcc9c6',
    railColorActive: '#00685f',
    buttonColor: '#ffffff',
    boxShadowFocus: '0 0 0 2px rgba(0, 104, 95, 0.2)'
  },

  Pagination: {
    itemColor: '#ffffff',
    itemColorHover: '#f0f7f5',
    itemColorActive: '#e2f0ee',
    itemTextColor: '#3d4947',
    itemTextColorHover: '#131b2e',
    itemTextColorActive: '#00685f',
    itemBorder: '1px solid #bcc9c6',
    itemBorderActive: '1px solid #00685f',
    itemBorderRadius: '4px',
    buttonBorder: '1px solid #bcc9c6',
    buttonIconColor: '#6d7a77'
  },

  DatePicker: {
    itemColorActive: '#e2f0ee',
    itemColorHover: '#f0f7f5',
    itemTextColorActive: '#00685f',
    panelColor: '#ffffff',
    panelBorderRadius: '8px',
  },

  Dropdown: {
    color: '#ffffff',
    optionTextColor: '#3d4947',
    optionTextColorHover: '#131b2e',
    optionTextColorActive: '#00685f',
    optionColorHover: '#f0f7f5',
    optionColorActive: '#e2f0ee',
    borderRadius: '4px',
    dividerColor: '#bcc9c6'
  },

  Tag: {
    color: '#f0f7f5',
    textColor: '#3d4947',
    border: '1px solid #bcc9c6',
    borderRadius: '4px',
    padding: '0 8px',
  },

  Progress: {
    railColor: '#bcc9c6',
    fontSize: '12px',
  },

  Badge: {
    color: '#BE123C'
  },

  Alert: {
    color: '#faf8ff',
    colorInfo: '#e2f0ee',
    colorSuccess: '#ecfdf5',
    colorWarning: '#fffbeb',
    colorError: '#fef2f2',
    border: '1px solid #bcc9c6',
    borderInfo: '1px solid #1DA7B4',
    borderSuccess: '1px solid #10B981',
    borderWarning: '1px solid #D97B29',
    borderError: '1px solid #BE123C',
    borderRadius: '8px',
    titleTextColor: '#131b2e',
    iconColor: '#00685f',
    contentTextColor: '#3d4947',
    closeIconColor: '#6d7a77',
    padding: '12px 16px'
  },

  Message: {
    color: '#ffffff',
    colorInfo: '#e2f0ee',
    colorSuccess: '#ecfdf5',
    colorWarning: '#fffbeb',
    colorError: '#fef2f2',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    iconColor: '#00685f',
    textColor: '#3d4947',
  },

  Notification: {
    color: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    textColor: '#3d4947',
  },

  Empty: {
    textColor: '#6d7a77',
    iconColor: '#bcc9c6',
    extraTextColor: '#6d7a77'
  },

  LoadingBar: {
    colorLoading: '#00685f',
    colorError: '#BE123C'
  },

  Tabs: {
    tabFontWeight: '500',
    tabBorderRadius: '4px',
    barColor: '#00685f',
    colorSegment: '#f0f7f5',
    tabColorSegment: '#ffffff',
    tabColor: 'transparent',
  },

  Collapse: {
    titleTextColor: '#131b2e',
    titleFontSize: '14px',
    titleFontWeight: '500',
    arrowColor: '#6d7a77',
    dividerColor: '#bcc9c6',
  },

  TimePicker: {
    panelColor: '#ffffff',
    itemTextColor: '#3d4947',
    itemTextColorActive: '#00685f',
    itemColorHover: '#f0f7f5',
  },

  Slider: {
    railColor: '#bcc9c6',
    railColorHover: '#6d7a77',
    fillColor: '#00685f',
    fillColorHover: '#008378',
    handleColor: '#ffffff',
    handleBoxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
    handleBoxShadowHover: '0 1px 2px 0 rgba(0, 0, 0, 0.15)',
    markFontSize: '12px'
  },

  Drawer: {
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    bodyPadding: '16px 24px',
    headerPadding: '16px 24px',
    footerPadding: '12px 24px'
  },

  Form: {
    labelTextColor: '#3d4947',
    labelFontWeight: '500',
    feedbackTextColor: '#BE123C',
    feedbackPadding: '4px 0 0'
  },

  DataTable: {
    thColor: '#f2f6f5',
    thTextColor: '#3d4947',
    thFontWeight: '600',
    tdColor: '#ffffff',
    tdTextColor: '#131b2e',
    borderColor: '#bcc9c6',
    tdColorHover: '#f0f7f5',
    borderRadius: '8px',
    loadingColor: '#00685f',
  }
}

export default light
