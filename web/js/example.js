const url = "/bosh/";
const domain = `${window.location.hostname}`;
const jsxc = new JSXC({
  loadConnectionOptions: (username, password) => {
    return Promise.resolve({
      xmpp: {
        url,
        domain,
      },
    });
  },
  connectionCallback: (jid, status) => {
    const CONNECTED = 5;
    const ATTACHED = 8;

    if (status === CONNECTED || status === ATTACHED) {
      $(".logout").show();
      $(".submit").hide();
    } else {
      $(".logout").hide();
      $(".submit").show();
    }
  },
});

subscriptToUPLogin();

function subscriptToUPLogin() {
  $("#up-login-button").on("click", async () => {
    // Request an account
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    // check if any number of accounts was returned
    // IF go to the dashboard
    if (accounts.length) {
      try {
        const Web3Token = window["web3-token"];
        const web3 = new Web3(window.ethereum);
        // getting address from which we will sign message
        const addresses = await web3.eth.getAccounts();
        console.log("addresses", addresses);
        const address = addresses[0];

        // generating a token with 1 day of expiration time
        const token = await Web3Token.sign(async (msg) => {
          try {
            const sig = await web3.eth.sign(msg, address);

            console.log("signature", { sig, address });

            return sig.signature;
          } catch (err) {
            console.error(">>> catch", err);
          }
        }, "1d");
        var jid = address + "@" + domain;
        jsxc
          .start(url, jid, token)
          .then(function () {
            console.log(">>> CONNECTION READY");
          })
          .catch(function (err) {
            console.error(">>> catch", err);
          });
      } catch (err) {
        console.error(">>> catch", err);
      }
    } else alert("No account was selected!");
  });
}
