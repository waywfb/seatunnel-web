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
package org.apache.seatunnel.datasource.classloader;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.net.URL;

class DatasourceClassLoaderTest {

    private static final String CHILD_FIRST_CLASS =
            "org.apache.seatunnel.datasource.classloader.DatasourceLoadConfig";

    private static DatasourceClassLoader newDatasourceClassLoader() throws Exception {
        URL codeSource =
                DatasourceLoadConfig.class.getProtectionDomain().getCodeSource().getLocation();
        return new DatasourceClassLoader(
                new URL[] {codeSource}, DatasourceClassLoaderTest.class.getClassLoader());
    }

    @Test
    void testLoadSameClassTwiceReturnsSameClass() throws Exception {
        DatasourceClassLoader classLoader = newDatasourceClassLoader();

        Class<?> first = classLoader.loadClass(CHILD_FIRST_CLASS);
        Class<?> second = classLoader.loadClass(CHILD_FIRST_CLASS);

        Assertions.assertSame(classLoader, first.getClassLoader());
        Assertions.assertSame(first, second);
        classLoader.close();
    }

    @Test
    void testLoadClassNotInDatasourceJarFromParent() throws Exception {
        DatasourceClassLoader classLoader = newDatasourceClassLoader();

        Class<?> loaded = classLoader.loadClass("java.lang.StringBuilder");

        Assertions.assertSame(StringBuilder.class, loaded);
        classLoader.close();
    }
}
