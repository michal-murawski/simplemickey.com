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

Let's assume we have a feature-based folder structure. Sometimes we need to have some state to be global: we need to export global providers from each feature. Then we pass those providers into main index.js file 

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

## Helpful functions

* **useAutorun[[link](https://mobx.js.org/refguide/autorun.html)] -** generating initial effect based on MST values and actions.

```typescript
import { DependencyList, useEffect } from 'react';
import { autorun } from 'mobx';
import { IReactionPublic } from 'mobx/lib/internal';

/**
 * WARNING: Please DO NOT pass `fooStore.fooProp` as a dependency. You should always pass `fooStore` without further
 * chain.
 */
export const useAutorun = (callback: (r: IReactionPublic) => any, deps: DependencyList) => {
  useEffect(
    () =>
      autorun(r => {
        callback(r);
      }),
    // eslint-disable-next-line
    deps,
  );
};


```

Then add extra eslint rule in other to force users to add dependency list:

```
"react-hooks/exhaustive-deps": [
      "warn",
      {
        "additionalHooks": "useAutorun"
      }
    ]
```

* **AsyncModel** - for creating a unified way of managing stores async state. A simple solution that should work in most cases.

  ```typescript
  import { types } from 'mobx-state-tree';

  export enum AsyncStatus {
    IDLE = 'IDLE',
    PENDING = 'PENDING',
    RESOLVED = 'RESOLVED',
    REJECTED = 'REJECTED',
  }

  export const AsyncModel = types
    .model('AsyncModel', {
      status: types.optional(types.enumeration<AsyncStatus>(Object.values(AsyncStatus)), AsyncStatus.IDLE),
      error: types.optional(types.string, ''),
    })
    .views(self => ({
      get isPending() {
        return self.status === AsyncStatus.PENDING;
      },
      get isIdle() {
        return self.status === AsyncStatus.IDLE;
      },
      get isLoading() {
        return this.isIdle || this.isPending;
      },
      get isResolved() {
        return self.status === AsyncStatus.RESOLVED;
      },
      get isRejected() {
        return self.status === AsyncStatus.REJECTED;
      },
    }))
    .actions(self => ({
      invoke() {
        self.status = AsyncStatus.PENDING;
        self.error = '';
      },
      resolve() {
        self.status = AsyncStatus.RESOLVED;
        self.error = '';
      },
      reject(error: string) {
        self.status = AsyncStatus.REJECTED;
        self.error = error;
      },
    }));

  ```
* **createEntityStore** - entity creator wrapper based on redux *[createEntityWrapper](https://redux-toolkit.js.org/api/createEntityAdapter).* Generates a set of prebuild selectors  (computed properties, **views** in MST), and actions (reducers).

```typescript
import { keyBy } from 'lodash';
import { applySnapshot, IAnyType, SnapshotOrInstance, types } from 'mobx-state-tree';

const DEFAULT_OPTIONS = {
  id: (entity: SnapshotOrInstance<{}>) => entity.id,
};

export function createEntityStore<T extends IAnyType>(entityModel: T, options: CreateEntityStoreOptions<T> = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const modelName = (entityModel.name || '').replace('Model', '') + 'Store';
  return types
    .model(modelName, {
      entities: types.optional(types.map(entityModel), {}),
    })
    .views(self => ({
      get all() {
        const all = Array.from(self.entities.values());
        if (opts.sortComparer) {
          all.sort(opts.sortComparer); // todo - fix performance by storing already sorted `ids` array
        }
        return all;
      },

      get total() {
        return this.all.length;
      },

      get isEmpty() {
        return this.total === 0;
      },

      get isNotEmpty() {
        return !this.isEmpty;
      },

      getById: (id: string) => {
        return self.entities.get(id);
      },
    }))
    .actions(self => ({
      setAll(entities: SnapshotOrInstance<T>[]) {
        applySnapshot(self.entities, keyBy(entities, opts.id));
      },

      addOne(entity: SnapshotOrInstance<T>) {
        self.entities.put(entity);
      },

      addMany(entities: SnapshotOrInstance<T>[]) {
        entities.forEach(this.addOne);
      },

      updateOne(entity: SnapshotOrInstance<T>) {
        self.entities.set(opts.id(entity), entity);
      },

      updateMany(entities: SnapshotOrInstance<T>[]) {
        entities.forEach(this.updateOne);
      },

      removeOne(entityId: EntityId) {
        self.entities.delete(entityId);
      },

      removeMany(entityIds: EntityId[]) {
        entityIds.forEach(this.removeOne);
      },

      removeAll() {
        self.entities.clear();
      },
    }));
}

type EntityId = string;

type CreateEntityStoreOptions<T> = {
  id?: (entity: SnapshotOrInstance<T>) => string;
  sortComparer?: (a: SnapshotOrInstance<T>, b: SnapshotOrInstance<T>) => number;
};

```

* **toMstFactory** - function that moves a lot of boilerplate and new store creation. We are mapping all the **envDeps** (another stores) and  

  ```typescript
  // @ts-ignore
  import makeInspectable from 'mobx-devtools-mst';
  import { connectReduxDevtools } from 'mst-middlewares';
  import { toFactory } from 'react-ioc';
  import { IAnyType } from 'mobx-state-tree';
  import { mapValues } from 'lodash';
  import { Token } from '@/common/ioc/types';

  /**
   * This function does 3 things:
   *  1. Creates MST store using `.create()` method with empty snapshot data.
   *  2. Provides env dependencies as a map, like: `{ fooStore: FooStore, barService: BarService }`
   *  2. Connects MST store to Redux and MobX Dev Tools only when development mode is enabled.
   */
  export function toMstFactory(mstModel: IAnyType, envDeps: { [key: string]: Token } = {}) {
    const depsValues = Object.values(envDeps);
    const depsKeys = Object.keys(envDeps);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return toFactory(depsValues as any, (...providedDeps) => {
      const env = mapValues(envDeps, (value, key) => {
        return providedDeps[depsKeys.indexOf(key)];
      });
      const store = mstModel.create(undefined, env);
      if (process.env.NODE_ENV === 'development') {
        connectReduxDevtools(require('remotedev'), store);
        makeInspectable(store);
      }
      return store;
    });
  }

  ```

## MST single store example 

This example will consist of two stores that will depend on each other (dashboards, folders). First, we define our model. `types` allows us to have a type static file checking and also run time. It means that even if we make some type errors or our API response change we will still have a run-time error from javascript (MST creator based this concept on [tcomb](https://www.npmjs.com/package/tcomb) library).

```typescript
export const LayoutModel = types.model('LayoutModel', {
  w: types.number,
  h: types.number,
  x: types.number,
  y: types.number,
  i: types.union(types.string, types.number),
  isDraggable: types.maybe(types.number),
  isResizable: types.maybe(types.number),
  maxH: types.maybe(types.number),
  maxW: types.maybe(types.number),
  moved: types.maybe(types.number),
  static: types.maybe(types.number),
  minW: types.maybe(types.number),
  minH: types.maybe(types.number),
});
export const WidgetModel = types.model('WidgetModel', {
  id: types.identifier,
  name: types.maybe(types.string),
  nlpQuery: types.maybe(types.string),
  type: types.enumeration<WidgetType>(Object.values(WidgetType)),
});

export const DashboardGridModel = types.model('DashboardGridModel', {
  layouts: types.map(LayoutModel),
  widgets: types.map(WidgetModel),
});

export const DashboardModel = types.model('DashboardModel', {
  id: types.identifier,
  grid: DashboardGridModel,
  name: types.string,
  readOnly: types.boolean,
  home: types.maybe(types.boolean),
  canvas: types.maybe(types.boolean),
});

```

<https://mobx-state-tree.js.org/overview/types>







```

```