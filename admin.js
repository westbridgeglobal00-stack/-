(() => {
  const $ = id => document.getElementById(id);
  const money = n => new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(Number(n||0));
  let categories=[], products=[];
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function notice(id,msg,ok=false){const e=$(id);e.textContent=msg;e.classList.toggle("success",ok)}
  function toast(msg){const e=$("adminToast");e.textContent=msg;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2500)}
  function configReady(){return !!window.wbConfigReady}
  async function showLogin(message=""){
    $("adminLogin").classList.remove("hidden");$("adminContent").classList.add("hidden");if(message)notice("adminLoginMessage",message);
  }
  async function authorize(){
    if(!configReady()){showLogin("Add your Supabase URL and publishable/anon key in supabase-config.js, then reload.");return}
    const {data:{user}}=await window.wbSupabase.auth.getUser();
    if(!user){showLogin();return}
    const {data:profile,error}=await window.wbSupabase.from("profiles").select("role").eq("id",user.id).single();
    if(error||!profile||profile.role!=="admin"){await showLogin("This account does not have administrator access. Grant the admin role using the secure SQL step in README.md.");return}
    $("adminLogin").classList.add("hidden");$("adminContent").classList.remove("hidden");$("adminEmail").textContent=user.email||"Administrator";await loadEverything();
  }
  async function login(e){e.preventDefault();notice("adminLoginMessage","Signing in…");const {error}=await window.wbSupabase.auth.signInWithPassword({email:$("adminEmailInput").value.trim(),password:$("adminPasswordInput").value});if(error){notice("adminLoginMessage",error.message);return}await authorize()}
  function switchPanel(name){
    document.querySelectorAll(".side-link").forEach(b=>b.classList.toggle("active",b.dataset.panel===name));
    document.querySelectorAll(".admin-panel").forEach(p=>p.classList.toggle("active",p.id===`panel-${name}`));
    $("panelTitle").textContent=name.charAt(0).toUpperCase()+name.slice(1);
    if(name==="orders")loadOrders();
  }
  async function loadEverything(){await Promise.all([loadCategories(),loadProducts(),loadOrders()]);updateStats()}
  async function loadCategories(){
    const {data,error}=await window.wbSupabase.from("categories").select("*").order("name");
    if(error){console.error(error);return}categories=data||[];renderCategoryOptions();renderCategoriesTable();
  }
  function renderCategoryOptions(){
    $("productCategory").innerHTML=categories.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("");
  }
  function renderCategoriesTable(){
    $("categoriesTable").innerHTML=`<table><thead><tr><th>Category</th><th>Status</th><th>Created</th></tr></thead><tbody>${categories.map(c=>`<tr><td><b>${esc(c.name)}</b></td><td><span class="status-badge">${c.is_active?"Active":"Hidden"}</span></td><td>${new Date(c.created_at).toLocaleDateString()}</td></tr>`).join("")||'<tr><td colspan="3">No categories yet.</td></tr>'}</tbody></table>`;
  }
  async function addCategory(e){
    e.preventDefault();const name=$("categoryName").value.trim();if(!name)return;
    const {error}=await window.wbSupabase.from("categories").insert({name});
    if(error){notice("categoryMessage",error.message);return}
    $("categoryName").value="";notice("categoryMessage","Category added.",true);await loadCategories();updateStats();
  }
  async function loadProducts(){
    const {data,error}=await window.wbSupabase.from("products").select("*,categories(name)").order("created_at",{ascending:false});
    if(error){console.error(error);toast(error.message);return}products=data||[];renderProductsTable();updateStats();
  }
  function renderProductsTable(){
    const q=$("adminProductSearch").value.toLowerCase();
    const rows=products.filter(p=>p.name.toLowerCase().includes(q));
    $("adminProductsTable").innerHTML=`<table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>${rows.map(p=>`<tr><td><b>${esc(p.name)}</b></td><td>${esc(p.categories?.name||"—")}</td><td>${money(p.price)}</td><td>${p.stock}</td><td><span class="status-badge">${p.is_active?"Published":"Hidden"}</span></td><td><div class="table-actions"><button data-edit="${p.id}">Edit</button><button class="danger" data-delete="${p.id}">Delete</button></div></td></tr>`).join("")||'<tr><td colspan="6">No products found.</td></tr>'}</tbody></table>`;
    $("adminProductsTable").querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editProduct(b.dataset.edit));
    $("adminProductsTable").querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteProduct(b.dataset.delete));
  }
  function editProduct(id){
    const p=products.find(x=>String(x.id)===String(id));if(!p)return;
    $("productId").value=p.id;$("productName").value=p.name;$("productCategory").value=p.category_id;$("productPrice").value=p.price;$("productCompare").value=p.compare_at_price??"";$("productStock").value=p.stock;$("productImage").value=p.image_url||"";$("productDescription").value=p.description||"";$("productFeatured").checked=!!p.featured;$("productActive").checked=!!p.is_active;$("productFormTitle").textContent="Edit product";$("saveProductButton").textContent="Update product";window.scrollTo({top:0,behavior:"smooth"});
  }
  function resetProduct(){ $("productForm").reset();$("productId").value="";$("productStock").value=0;$("productActive").checked=true;$("productFormTitle").textContent="Add a product";$("saveProductButton").textContent="Save product";notice("productFormMessage","");}
  async function saveProduct(e){
    e.preventDefault();const id=$("productId").value;
    const payload={name:$("productName").value.trim(),category_id:$("productCategory").value||null,price:Number($("productPrice").value),compare_at_price:$("productCompare").value?Number($("productCompare").value):null,stock:Number($("productStock").value),image_url:$("productImage").value.trim()||null,description:$("productDescription").value.trim(),featured:$("productFeatured").checked,is_active:$("productActive").checked};
    const query=id?window.wbSupabase.from("products").update(payload).eq("id",id):window.wbSupabase.from("products").insert(payload);
    const {error}=await query;if(error){notice("productFormMessage",error.message);return}
    notice("productFormMessage",id?"Product updated.":"Product created.",true);resetProduct();await loadProducts();toast("Catalogue saved");
  }
  async function deleteProduct(id){
    if(!confirm("Delete this product? This cannot be undone."))return;
    const {error}=await window.wbSupabase.from("products").delete().eq("id",id);if(error){toast(error.message);return}await loadProducts();toast("Product deleted");
  }
  async function loadOrders(){
    const {data,error}=await window.wbSupabase.from("orders").select("id,customer_id,total_amount,currency,status,created_at").order("created_at",{ascending:false}).limit(100);
    if(error){$("ordersTable").textContent=error.message;return}
    renderOrders(data||[]);renderOrders(data||[],"recentOrders",true);updateStats(data||[]);
  }
  function renderOrders(rows,target="ordersTable",compact=false){
    const headers=compact?`<th>Order</th><th>Total</th><th>Status</th><th>Date</th>`:`<th>Order</th><th>Customer ID</th><th>Total</th><th>Status</th><th>Date</th><th>Update</th>`;
    const body=rows.map(o=>compact?`<tr><td><b>#${o.id.slice(0,8)}</b></td><td>${money(o.total_amount)}</td><td><span class="status-badge">${esc(o.status)}</span></td><td>${new Date(o.created_at).toLocaleDateString()}</td></tr>`:`<tr><td><b>#${o.id.slice(0,8)}</b></td><td>${esc(o.customer_id.slice(0,8))}…</td><td>${money(o.total_amount)}</td><td><span class="status-badge">${esc(o.status)}</span></td><td>${new Date(o.created_at).toLocaleString()}</td><td><select class="status-select" data-order="${o.id}">${["pending","confirmed","processing","shipped","delivered","cancelled","refunded"].map(s=>`<option ${o.status===s?"selected":""}>${s}</option>`).join("")}</select></td></tr>`).join("");
    $(target).innerHTML=`<table><thead><tr>${headers}</tr></thead><tbody>${body||`<tr><td colspan="${compact?4:6}">No orders yet.</td></tr>`}</tbody></table>`;
    if(!compact)$(target).querySelectorAll("[data-order]").forEach(sel=>sel.onchange=async()=>{const {error}=await window.wbSupabase.from("orders").update({status:sel.value}).eq("id",sel.dataset.order);if(error){toast(error.message);return}toast("Order status updated");await loadOrders()});
  }
  function updateStats(orderRows){
    $("statProducts").textContent=products.filter(p=>p.is_active).length;$("statCategories").textContent=categories.length;
    if(orderRows){$("statOrders").textContent=orderRows.length;$("statPending").textContent=orderRows.filter(o=>o.status==="pending").length}
    else window.wbSupabase.from("orders").select("id,status").then(({data})=>{if(data){$("statOrders").textContent=data.length;$("statPending").textContent=data.filter(o=>o.status==="pending").length}});
  }
  function setup(){
    $("adminLoginForm").onsubmit=login;$("adminSignOut").onclick=async()=>{await window.wbSupabase.auth.signOut();location.reload()};
    document.querySelectorAll(".side-link").forEach(b=>b.onclick=()=>switchPanel(b.dataset.panel));
    document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>switchPanel(b.dataset.go));
    $("productForm").onsubmit=saveProduct;$("resetProductForm").onclick=resetProduct;$("categoryForm").onsubmit=addCategory;$("adminProductSearch").oninput=renderProductsTable;$("refreshOrders").onclick=loadOrders;
    authorize();
  }
  document.addEventListener("DOMContentLoaded",setup);
})();