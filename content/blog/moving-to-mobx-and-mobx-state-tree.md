---
title: Moving to Mobx and Mobx State Tree
date: 2020-06-24T08:39:31.127Z
subtitle: Learning new state management habits
tags: react,redux,state,management,mobx,mst,mobx-state-tree,typescript
---
## Few tutorials first

1. [Mobx State Tree introduction](https://www.youtube.com/watch?v=rwqwwn_46kA)
2. [Mobx State Tree egghead course](https://egghead.io/courses/manage-application-state-with-mobx-state-tree)
3. [Mobx and Redux differences](https://www.youtube.com/watch?v=76FRrbY18Bs)

## Required libraries

1. `mobx`
2. `mobx-react-lite`
3. `mobx-state-tree`
4. `mobx-utils`
5. `mst-middlewares`
6. `react-ioc`

## Structure 

Let's assume we have a feature-based folder structure. Sometimes we need to have some state to be global: we need to export a global providers from each feature. Then we pass those provieders into main index.js file 

```typescript
// rooit-ioc component file
import React from 'react';
import { chain } from 'lodash';
import { provider } from 'react-ioc';
import { features } from './index';
import { isNotEmpty } from '@/common/lib/array';

const featureProviders = chain(features)
  .values()
  .filter('providers')
  .filter(isNotEmpty)
  .flatMap('providers')
  .value();

export const RootIocProvider: React.FunctionComponent = provider(...featureProviders)(({ children }) => {
  return <>{children}</>;
});


// main index.tsx file
ReactDOM.render(
  <RootIocProvider>
    <Router history={browserHistory}>
      <App routes={routes} />
    </Router>
  </RootIocProvider>,
  document.getElementById('root'),
);

```