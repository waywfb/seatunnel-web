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
    bodyColor: '#F9FAFB',

    /**************** Brand color */
    primaryColor: '#2563EB',
    primaryColorHover: '#1D4ED8',
    primaryColorPressed: '#1E40AF',
    primaryColorSuppl: '#2563EB',

    /**************** Function of color */
    infoColor: '#3B82F6',
    successColor: '#16A34A',
    warningColor: '#F59E0B',
    errorColor: '#DC2626',

    /**************** Text */
    textColor1: '#111827',
    textColor2: '#374151',
    textColor3: '#6B7280',

    /**************** Border */
    borderColor: '#E5E7EB',
    dividerColor: '#E5E7EB',

    /**************** Placeholder */
    placeholderColor: '#9CA3AF',
    placeholderColorDisabled: '#D1D5DB',

    /**************** Focus */
    focusColor: 'rgba(59, 130, 246, 0.2)',
    boxShadowFocus: '0 0 0 2px rgba(59, 130, 246, 0.2)',
    boxShadowFocusOutset: '0 0 0 2px rgba(59, 130, 246, 0.2)',
    boxShadowFocusOutsetInset: 'inset 0 0 0 2px rgba(59, 130, 246, 0.2)',
    boxShadowFromPopup: '0 2px 8px rgba(0, 0, 0, 0.06)',

    /**************** Opacity */
    opacityDisabled: '0.5',
    fontWeight: '400',
    fontWeightStrong: '500',

    /**************** Radius */
    borderRadius: '4px',
    borderRadiusSmall: '4px'
  },

  Layout: {
    color: '#F9FAFB',
    headerColor: '#FFFFFF',
    headerColorModal: '#FFFFFF',
    headerColorPopover: '#FFFFFF',
    siderColor: '#FFFFFF',
    siderColorModal: '#FFFFFF',
    siderColorPopover: '#FFFFFF',
    borderColor: '#E5E7EB'
  },

  Menu: {
    itemColorActive: '#EFF6FF',
    itemColorActiveHover: '#DBEAFE',
    itemTextColor: '#374151',
    itemTextColorActive: '#2563EB',
    itemTextColorChildActive: '#2563EB',
    itemTextColorHover: '#111827',
    itemTextColorChildActiveHover: '#1D4ED8',
    itemIconColor: '#6B7280',
    itemIconColorActive: '#2563EB',
    itemIconColorHover: '#374151',
    itemColorHover: '#F3F4F6',
    itemHeight: '40px',
    borderRadius: '4px',
    borderColor: '#E5E7EB',
    color: '#FFFFFF',
    groupTextColor: '#9CA3AF',
    arrowColor: '#6B7280'
  },

  Table: {
    thColor: '#F9FAFB',
    thColorModal: '#F9FAFB',
    thColorPopover: '#F9FAFB',
    thTextColor: '#6B7280',
    thFontWeight: '500',
    tdColor: '#FFFFFF',
    tdColorModal: '#FFFFFF',
    tdColorPopover: '#FFFFFF',
    tdTextColor: '#111827',
    borderColor: '#E5E7EB',
    borderColorModal: '#E5E7EB',
    borderColorPopover: '#E5E7EB',
    tdColorStriped: '#F9FAFB',
    tdColorHover: '#F3F4F6'
  },

  Button: {
    color: '#2563EB',
    colorHover: '#1D4ED8',
    colorPressed: '#1E40AF',
    colorFocus: '#2563EB',
    textColor: '#FFFFFF',
    textColorHover: '#FFFFFF',
    textColorPressed: '#FFFFFF',
    textColorFocus: '#FFFFFF',
    border: '1px solid transparent',
    borderHover: '1px solid transparent',
    borderPressed: '1px solid transparent',
    borderFocus: '1px solid transparent',
    textColorDisabled: '#9CA3AF',
    opacityDisabled: '0.5',
    fontWeight: '500',
    borderRadius: '4px',
    height: '40px',
    padding: '0 16px',
    fontSize: '14px',
    iconSize: '18px',

    /* Secondary */
    colorSecondary: '#FFFFFF',
    colorSecondaryHover: '#F9FAFB',
    colorSecondaryPressed: '#F3F4F6',
    textColorSecondary: '#374151',
    textColorSecondaryHover: '#111827',
    textColorSecondaryPressed: '#111827',
    borderSecondary: '1px solid #D1D5DB',
    borderSecondaryHover: '1px solid #9CA3AF',

    /* Error / Destructive */
    colorError: '#DC2626',
    colorErrorHover: '#B91C1C',
    colorErrorPressed: '#991B1B',
    colorErrorFocus: '#DC2626',
    textColorError: '#FFFFFF',

    /* Warning */
    colorWarning: '#F59E0B',
    colorWarningHover: '#D97706',
    colorWarningPressed: '#B45309',
    colorWarningFocus: '#F59E0B',
    textColorWarning: '#FFFFFF',

    /* Success */
    colorSuccess: '#16A34A',
    colorSuccessHover: '#15803D',
    colorSuccessPressed: '#166534',
    colorSuccessFocus: '#16A34A',
    textColorSuccess: '#FFFFFF',

    /* Info */
    colorInfo: '#3B82F6',
    colorInfoHover: '#2563EB',
    colorInfoPressed: '#1D4ED8',
    colorInfoFocus: '#3B82F6',
    textColorInfo: '#FFFFFF',

    /* Ghost */
    textColorGhost: '#374151',
    textColorGhostHover: '#111827',
    colorGhost: 'transparent',
    colorGhostHover: '#F3F4F6',
    colorGhostPressed: '#E5E7EB',

    /* Text (link-like) */
    textColorText: '#2563EB',
    textColorTextHover: '#1D4ED8',
    textColorTextPressed: '#1E40AF'
  },

  Input: {
    color: '#FFFFFF',
    colorModal: '#FFFFFF',
    colorPopover: '#FFFFFF',
    textColor: '#111827',
    placeholderColor: '#9CA3AF',
    border: '1px solid #D1D5DB',
    borderHover: '1px solid #9CA3AF',
    borderFocus: '1px solid #3B82F6',
    boxShadowFocus: '0 0 0 2px rgba(59, 130, 246, 0.2)',
    borderError: '1px solid #EF4444',
    boxShadowFocusError: '0 0 0 2px rgba(239, 68, 68, 0.2)',
    colorDisabled: '#F3F4F6',
    colorDisabledModal: '#F3F4F6',
    textColorDisabled: '#D1D5DB',
    borderRadius: '4px',
    height: '40px',
    fontSize: '14px',
    padding: '0 12px',
    iconSize: '18px'
  },

  Select: {
    menuColor: '#FFFFFF',
    menuColorModal: '#FFFFFF',
    menuColorPopover: '#FFFFFF',
    menuBoxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    menuBorder: '1px solid #E5E7EB',
    menuBorderRadius: '4px',
    optionTextColor: '#374151',
    optionTextColorHover: '#111827',
    optionTextColorActive: '#2563EB',
    optionColorHover: '#F3F4F6',
    optionColorActive: '#EFF6FF',
    optionFontSize: '14px',
    optionHeight: '36px',
    optionPadding: '0 12px',
    color: '#FFFFFF',
    colorModal: '#FFFFFF',
    colorPopover: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderHover: '1px solid #9CA3AF',
    borderFocus: '1px solid #3B82F6',
    boxShadowFocus: '0 0 0 2px rgba(59, 130, 246, 0.2)',
    borderRadius: '4px',
    height: '40px',
    fontSize: '14px',
    placeholderColor: '#9CA3AF'
  },

  Card: {
    color: '#FFFFFF',
    colorModal: '#FFFFFF',
    colorPopover: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: '8px',
    paddingTop: '16px',
    paddingBottom: '16px',
    paddingLeft: '16px',
    paddingRight: '16px',
    boxShadow: 'none',
    titleFontSize: '16px',
    titleFontWeight: '500',
    titleTextColor: '#111827'
  },

  Dialog: {
    color: '#FFFFFF',
    colorModal: '#FFFFFF',
    colorPopover: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    titleFontSize: '16px',
    titleFontWeight: '600',
    titleTextColor: '#111827',
    contentFontSize: '14px',
    contentTextColor: '#374151',
    actionSpace: '16px'
  },

  Tooltip: {
    color: '#111827',
    textColor: '#F9FAFB',
    borderRadius: '4px',
    fontSize: '12px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)'
  },

  Popover: {
    color: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    padding: '12px',
    fontSize: '14px',
    textColor: '#374151'
  },

  Checkbox: {
    color: '#FFFFFF',
    colorChecked: '#2563EB',
    border: '1px solid #D1D5DB',
    borderFocus: '1px solid #3B82F6',
    borderRadius: '4px',
    textColor: '#111827',
    size: '18px'
  },

  Radio: {
    radioColor: '#FFFFFF',
    radioColorActive: '#2563EB',
    border: '1px solid #D1D5DB',
    borderActive: '1px solid #2563EB',
    textColor: '#111827'
  },

  Switch: {
    railColor: '#D1D5DB',
    railColorActive: '#2563EB',
    buttonColor: '#FFFFFF',
    buttonBoxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
  },

  Pagination: {
    itemColor: '#FFFFFF',
    itemColorHover: '#F3F4F6',
    itemColorActive: '#EFF6FF',
    itemTextColor: '#374151',
    itemTextColorHover: '#111827',
    itemTextColorActive: '#2563EB',
    itemBorder: '1px solid #E5E7EB',
    itemBorderActive: '1px solid #2563EB',
    itemBorderRadius: '4px',
    itemFontSize: '14px',
    itemSize: '36px',
    buttonBorder: '1px solid #E5E7EB',
    buttonIconColor: '#6B7280'
  },

  DatePicker: {
    itemColorActive: '#EFF6FF',
    itemColorHover: '#F3F4F6',
    itemTextColorActive: '#2563EB',
    panelColor: '#FFFFFF',
    panelBorderColor: '#E5E7EB',
    panelBorderRadius: '8px',
    calendarDaysColor: '#6B7280'
  },

  Dropdown: {
    color: '#FFFFFF',
    colorModal: '#FFFFFF',
    colorPopover: '#FFFFFF',
    optionTextColor: '#374151',
    optionTextColorHover: '#111827',
    optionTextColorActive: '#2563EB',
    optionColorHover: '#F3F4F6',
    optionColorActive: '#EFF6FF',
    borderRadius: '4px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    dividerColor: '#E5E7EB'
  },

  Tag: {
    color: '#F3F4F6',
    textColor: '#374151',
    border: '1px solid #E5E7EB',
    borderRadius: '4px',
    fontSize: '12px',
    padding: '0 8px',
    height: '24px'
  },

  Progress: {
    railColor: '#E5E7EB',
    color: '#3B82F6',
    textColor: '#374151',
    fontSize: '12px',
    fontWeight: '500'
  },

  Badge: {
    color: '#EF4444'
  },

  Alert: {
    color: '#F9FAFB',
    colorInfo: '#EFF6FF',
    colorSuccess: '#ECFDF5',
    colorWarning: '#FFFBEB',
    colorError: '#FEF2F2',
    border: '1px solid #E5E7EB',
    borderInfo: '1px solid #BFDBFE',
    borderSuccess: '1px solid #A7F3D0',
    borderWarning: '1px solid #FDE68A',
    borderError: '1px solid #FECACA',
    borderRadius: '8px',
    titleTextColor: '#111827',
    iconColor: '#3B82F6',
    contentTextColor: '#374151',
    closeIconColor: '#9CA3AF',
    padding: '12px 16px'
  },

  Message: {
    color: '#FFFFFF',
    colorInfo: '#EFF6FF',
    colorSuccess: '#ECFDF5',
    colorWarning: '#FFFBEB',
    colorError: '#FEF2F2',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    iconColor: '#3B82F6',
    textColor: '#374151',
    closeColor: '#9CA3AF'
  },

  Notification: {
    color: '#FFFFFF',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    titleTextColor: '#111827',
    textColor: '#374151',
    closeColor: '#9CA3AF'
  },

  Empty: {
    textColor: '#9CA3AF',
    iconColor: '#D1D5DB',
    extraTextColor: '#6B7280'
  },

  LoadingBar: {
    color: '#3B82F6',
    colorError: '#EF4444'
  },

  Tabs: {
    tabTextColor: '#6B7280',
    tabTextColorActive: '#2563EB',
    tabTextColorHover: '#111827',
    tabFontSize: '14px',
    tabFontWeight: '500',
    tabBorderRadius: '0',
    barColor: '#2563EB',
    colorSegment: '#F3F4F6',
    tabColorSegment: '#FFFFFF',
    tabColorSegmentActive: '#FFFFFF',
    paneColor: '#FFFFFF',
    tabColor: 'transparent',
    tabColorHover: '#F3F4F6',
    borderColor: '#E5E7EB'
  },

  Collapse: {
    titleTextColor: '#111827',
    titleTextColorActive: '#2563EB',
    titleFontSize: '14px',
    titleFontWeight: '500',
    arrowColor: '#6B7280',
    dividerColor: '#E5E7EB',
    itemBorderColor: '#E5E7EB',
    titlePadding: '12px 0'
  },

  TimePicker: {
    panelColor: '#FFFFFF',
    panelBorderColor: '#E5E7EB',
    panelBorderRadius: '8px',
    itemTextColor: '#374151',
    itemTextColorActive: '#2563EB',
    itemColorHover: '#F3F4F6',
    itemColorActive: '#EFF6FF'
  },

  Slider: {
    railColor: '#D1D5DB',
    railColorHover: '#9CA3AF',
    fillColor: '#3B82F6',
    fillColorHover: '#2563EB',
    handleColor: '#FFFFFF',
    handleBoxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    handleBoxShadowHover: '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
    markColor: '#6B7280',
    markFontSize: '12px'
  },

  Drawer: {
    color: '#FFFFFF',
    border: '1px solid #E5E7EB',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    bodyPadding: '16px 24px',
    headerPadding: '16px 24px',
    footerPadding: '12px 24px'
  },

  Form: {
    labelTextColor: '#374151',
    labelFontSize: '14px',
    labelFontWeight: '500',
    feedbackTextColor: '#EF4444',
    feedbackFontSize: '12px',
    feedbackPadding: '4px 0 0'
  },

  DataTable: {
    thColor: '#F9FAFB',
    thTextColor: '#6B7280',
    thFontWeight: '500',
    tdColor: '#FFFFFF',
    tdTextColor: '#111827',
    borderColor: '#E5E7EB',
    tdColorHover: '#F3F4F6',
    tdColorStriped: '#F9FAFB',
    borderRadius: '4px',
    loadingColor: '#3B82F6',
    paginationColor: '#2563EB',
    paginationTextColor: '#374151'
  }
}

export default light
