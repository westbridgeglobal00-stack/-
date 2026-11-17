(() => {
  const $ = (id) => document.getElementById(id);
  const money = (n) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(n || 0));
  let products = [], categories = [], cart = JSON.parse(localStorage.getItem("wb_cart") || "[]");
  let selectedCategory = "all", searchTerm = "", authMode = "signin", currentUser = null;
  const demoProducts = [
    {id:"demo-1",name:"Studio Wireless Headphones",category_name:"Electronics",price:38500,compare_at_price:45000,stock:18,featured:true,description:"Comfortable everyday audio with a clean modern design.",image_url:"",is_active:true},
    {id:"demo-2",name:"Everyday Smart Watch",category_name:"Electronics",price:52500,compare_at_price:null,stock:12,featured:true,description:"A versatile smartwatch for everyday routines.",image_url:"",is_active:true},
    {id:"demo-3",name:"Classic Street Sneakers",category_name:"Fashion",price:32000,compare_at_price:40000,stock:7,featured:true,description:"A clean casual style for everyday wear.",image_url:"",is_active:true},
    {id:"demo-4",name:"Minimal Desk Lamp",category_name:"Home & Living",price:14500,compare_at_price:null,stock:3,featured:false,description:"A simple accent for your home or workspace.",image_url:"",is_active:true}
  ];
  function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
  function configWarning(){return !window.wbConfigReady}
  async function loadStore(){
    if(configWarning()){products=demoProducts;categories=["Electronics","Fashion","Home & Living","Phones & Tablets","Beauty","Sports"];$("statusMessage").textContent="Preview mode: connect your Supabase project to load live products and accept orders.";renderAll();return}
    const [p,c]=await Promise.all([
      window.wbSupabase.from("products").select("id,name,description,price,compare_at_price,stock,image_url,featured,is_active,categories(name)").eq("is_active",true).order("created_at",{ascending:false}),
      window.wbSupabase.from("categories").select("id,name").eq("is_active",true).order("name")
    ]);
    if(p.error){$("statusMessage").textContent="Could not load products. Check your Supabase SQL setup and connection.";console.error(p.error);products=[]}
    else products=(p.data||[]).map(x=>({...x,category_name:x.categories?.name||"General"}));
    categories=(c.data||[]).map(x=>x.name);
    $("statusMessage").textContent=products.length?"":"No products are published yet. Please check back soon.";
    renderAll();
    const {data:{user}}=await window.wbSupabase.auth.getUser();currentUser=user;
    if(user)$("accountButton").textContent="My account";
  }
  function renderCategories(){
    const nav=$("categoryNav");nav.innerHTML=`<a href="#" data-category="all" class="${selectedCategory==="all"?"active":""}">All departments</a>`+categories.map(c=>`<a href="#" data-category="${escapeHtml(c)}" class="${selectedCategory===c?"active":""}">${escapeHtml(c)}</a>`).join("");
    nav.querySelectorAll("[data-category]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();selectedCategory=a.dataset.category;renderAll()}));
    $("categoryGrid").querySelectorAll("[data-category]").forEach(b=>b.onclick=()=>{selectedCategory=b.dataset.category;renderAll();$("discover").scrollIntoView({behavior:"smooth"})});
  }
  function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function renderProducts(){
    let list=products.filter(p=>(selectedCategory==="all"||p.category_name===selectedCategory)&&(`${p.name} ${p.description||""} ${p.category_name}`).toLowerCase().includes(searchTerm));
    const sort=$("sortSelect").value;if(sort==="price-low")list.sort((a,b)=>a.price-b.price);if(sort==="price-high")list.sort((a,b)=>b.price-a.price);if(sort==="newest")list.sort((a,b)=>String(b.created_at||"").localeCompare(String(a.created_at||"")));
    $("productsTitle").textContent=searchTerm?`Search results for “${searchTerm}”`:selectedCategory==="all"?"Featured products":selectedCategory;
    $("productGrid").innerHTML=list.length?list.map(p=>`<article class="product-card"><div class="product-image">${p.image_url?`<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.style.display='none'">`:`<span class="image-placeholder">WB</span>`}</div><div class="product-info"><span class="product-category">${escapeHtml(p.category_name)}</span><h3>${escapeHtml(p.name)}</h3><p class="product-description">${escapeHtml(p.description||"Discover this product on Westbridge Global.")}</p><div class="price-row"><span class="price">${money(p.price)}</span>${p.compare_at_price?`<span class="old-price">${money(p.compare_at_price)}</span>`:""}</div><div class="product-actions"><button data-add="${escapeHtml(p.id)}" ${Number(p.stock)<=0?"disabled":""}>${Number(p.stock)<=0?"Out of stock":"Add to cart"}</button><button class="secondary" data-view="${escapeHtml(p.id)}">Details</button></div></div></article>`).join(""):`<div class="empty-state">No products found. Try another search or category.</div>`;
    $("productGrid").querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>addToCart(b.dataset.add));
    $("productGrid").querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{const p=products.find(x=>String(x.id)===b.dataset.view);if(p)alert(`${p.name}\n\n${p.description||"No additional description."}\n\nPrice: ${money(p.price)}\nAvailable stock: ${p.stock}`)});
  }
  function renderAll(){renderCategories();renderProducts();renderCartCount()}
  function addToCart(id){const p=products.find(x=>String(x.id)===String(id));if(!p)return;const item=cart.find(x=>String(x.id)===String(id));if(item)item.quantity++;else cart.push({id:p.id,name:p.name,price:p.price,quantity:1});persistCart();toast("Added to your cart")}
  function persistCart(){localStorage.setItem("wb_cart",JSON.stringify(cart));renderCartCount();renderCart()}
  function renderCartCount(){$("cartCount").textContent=cart.reduce((n,x)=>n+x.quantity,0)}
  function renderCart(){
    $("cartItems").innerHTML=cart.length?cart.map(x=>`<div class="cart-line"><div><b>${escapeHtml(x.name)}</b><small>${money(x.price)} × ${x.quantity}</small></div><div><b>${money(x.price*x.quantity)}</b><br><button data-remove="${escapeHtml(x.id)}">Remove</button></div></div>`).join(""):`<div class="empty-state">Your cart is empty.</div>`;
    $("cartTotal").textContent=money(cart.reduce((n,x)=>n+x.price*x.quantity,0));
    $("cartItems").querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{cart=cart.filter(x=>String(x.id)!==b.dataset.remove);persistCart()});
  }
  async function placeOrder(){
    const msg=$("checkoutMessage");msg.textContent="";
    if(!cart.length){msg.textContent="Your cart is empty.";return}
    if(configWarning()){msg.textContent="Connect Supabase and run schema.sql before placing an order.";return}
    const {data:{user}}=await window.wbSupabase.auth.getUser();
    if(!user){$("cartDialog").close();$("accountDialog").showModal();$("authMessage").textContent="Please sign in before placing an order.";return}
    const total=cart.reduce((n,x)=>n+x.price*x.quantity,0);
    const {data:order,error}=await window.wbSupabase.from("orders").insert({customer_id:user.id,total_amount:total,currency:"NGN",status:"pending"}).select("id").single();
    if(error){msg.textContent=error.message;return}
    const lines=cart.filter(x=>!String(x.id).startsWith("demo-")).map(x=>({order_id:order.id,product_id:x.id,product_name:x.name,quantity:x.quantity,unit_price:x.price}));
    if(lines.length!==cart.length){msg.textContent="Demo items are not connected to the live catalogue. Empty your cart and add live products.";await window.wbSupabase.from("orders").delete().eq("id",order.id);return}
    const {error:lineError}=await window.wbSupabase.from("order_items").insert(lines);
    if(lineError){msg.textContent=lineError.message;await window.wbSupabase.from("orders").delete().eq("id",order.id);return}
    cart=[];persistCart();msg.textContent="Order request submitted. No payment has been collected.";msg.classList.add("success");toast("Order request received");
  }
  async function submitAuth(e){
    e.preventDefault();const email=$("authEmail").value.trim(),password=$("authPassword").value,msg=$("authMessage");msg.textContent="Please wait…";msg.classList.remove("success");
    if(configWarning()){msg.textContent="Connect Supabase first.";return}
    const result=authMode==="signin"?await window.wbSupabase.auth.signInWithPassword({email,password}):await window.wbSupabase.auth.signUp({email,password});
    if(result.error){msg.textContent=result.error.message;return}
    if(authMode==="signup"&&!result.data.session){msg.textContent="Account created. Check your email to confirm your address, then sign in.";msg.classList.add("success");return}
    currentUser=result.data.user;$("accountButton").textContent="My account";msg.textContent="Signed in successfully.";msg.classList.add("success");
    if(authMode==="signin")setTimeout(()=>$("accountDialog").close(),700);
  }
  function setup(){
    $("year").textContent=new Date().getFullYear();$("searchForm").onsubmit=e=>{e.preventDefault();searchTerm=$("searchInput").value.trim().toLowerCase();renderProducts()};
    $("searchInput").oninput=()=>{searchTerm=$("searchInput").value.trim().toLowerCase();renderProducts()};
    $("sortSelect").onchange=renderProducts;
    $("accountButton").onclick=async()=>{if(!configWarning()){const {data:{user}}=await window.wbSupabase.auth.getUser();currentUser=user;if(user){$("authTitle").textContent="Your account";$("authMessage").textContent=`Signed in as ${user.email}`;$("signOutButton").classList.remove("hidden")}else{$("authTitle").textContent="Welcome back";$("signOutButton").classList.add("hidden")}}$("accountDialog").showModal()};
    $("authForm").onsubmit=submitAuth;$("authSwitch").onclick=()=>{authMode=authMode==="signin"?"signup":"signin";$("authTitle").textContent=authMode==="signin"?"Welcome back":"Create your account";$("authSubmit").textContent=authMode==="signin"?"Sign in":"Create account";$("authSwitch").textContent=authMode==="signin"?"New here? Create an account":"Already registered? Sign in"};
    $("signOutButton").onclick=async()=>{await window.wbSupabase.auth.signOut();currentUser=null;$("accountButton").textContent="Account";$("authMessage").textContent="Signed out.";};
    $("cartButton").onclick=()=>{$("cartDialog").showModal();renderCart()};$("checkoutButton").onclick=placeOrder;
    loadStore();
  }
  document.addEventListener("DOMContentLoaded",setup);
})();