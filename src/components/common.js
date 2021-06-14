export function set_imm_del(prev, val) {
    let ns = new Set(prev)
    ns.delete(val)
    return ns
}

export function set_imm_add(prev, val) {
    return new Set(prev).add(val)
}

export const adv_stackstyle = { root: { border: "1px solid", background: "#fcfcfc", margin: "10px 0", padding: "15px", height: "2000px" } }

