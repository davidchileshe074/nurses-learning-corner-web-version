/**
 * polyfills.ts
 * Needed for older iOS versions and browsers that don't support modern ES features
 * specifically needed for pdf.js v4/v5 and react-pdf v9/v10
 */

if (typeof window !== 'undefined') {
    // Promise.withResolvers (Standardized in ES2024, supported in iOS 17.4+)
    if (typeof Promise.withResolvers === 'undefined') {
        (Promise as any).withResolvers = function () {
            let resolve: any, reject: any;
            const promise = new Promise((res, rej) => {
                resolve = res;
                reject = rej;
            });
            return { promise, resolve, reject };
        };
    }

    // Object.groupBy (Standardized in ES2024, supported in iOS 17.4+)
    if (typeof (Object as any).groupBy === 'undefined') {
        (Object as any).groupBy = function (items: any, callback: any) {
            const result = Object.create(null);
            let i = 0;
            for (const item of items) {
                const key = callback(item, i++);
                if (!result[key]) {
                    result[key] = [];
                }
                result[key].push(item);
            }
            return result;
        };
    }

    // Array.fromAsync (Standardized in ES2024, supported in iOS 17.4+)
    if (typeof (Array as any).fromAsync === 'undefined') {
        (Array as any).fromAsync = async function (iterable: any, mapFn: any, thisArg: any) {
            const items = [];
            let i = 0;
            for await (const item of iterable) {
                items.push(mapFn ? mapFn.call(thisArg, item, i++) : item);
            }
            return items;
        };
    }

    // Object.hasOwn (supported since iOS 15.4)
    if (typeof Object.hasOwn === 'undefined') {
        (Object as any).hasOwn = function (instance: any, key: PropertyKey): boolean {
            return Object.prototype.hasOwnProperty.call(instance, key);
        };
    }

    // Promise.allSettled (supported since iOS 13)
    if (typeof Promise.allSettled === 'undefined') {
        (Promise as any).allSettled = function (promises: any[]) {
            return Promise.all(promises.map(p => Promise.resolve(p).then(
                value => ({ status: 'fulfilled', value }),
                reason => ({ status: 'rejected', reason })
            )));
        };
    }

    // Basic check for Safari/iOS memory limit issues with workers
    // Sometimes we need to disable workers if we detect very limited hardware, 
    // but for now we focus on feature parity.
}
